"""Import public WordPress copy and selected media into the Astro prototype.

Usage: python scripts/import-wordpress-content.py EXPORT.xml FULL_BACKUP.zip

Only published page/post bodies and referenced uploads are read. The source
archive also contains private mail, database and form submissions; none of
those are copied into the repository.
"""

from __future__ import annotations

import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlparse, unquote
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "website/src/content/pages"
MEDIA = ROOT / "website/public/legacy-media"
NS = {
    "wp": "http://wordpress.org/export/1.2/",
    "content": "http://purl.org/rss/1.0/modules/content/",
}
HAND_BUILT = {
    "/", "/products/", "/industries/", "/materials/", "/capabilities/",
    "/about-us/", "/faq/", "/certifications/", "/contact-us/", "/blog/",
}
BADGES = {"ul.jpg", "rohs.jpg", "rohs-80x54.jpg", "ce-80x80.png", "reach_rohs-2-80x61.jpg"}
ROUTES: dict[str, str] = {}


def clean_text(value: str) -> str:
    value = html.unescape(value).replace("\xa0", " ")
    value = value.replace("\ufffd", "'")
    return re.sub(r"[ \t]+", " ", value)


def local_link(value: str) -> str:
    value = unquote(value).strip(" \"'")
    if value.startswith("mailto:http"):
        value = value.removeprefix("mailto:")
    parsed = urlparse(value)
    if "/wp-content/uploads/" in parsed.path:
        return "/legacy-media/" + parsed.path.split("/wp-content/uploads/", 1)[1]
    if parsed.netloc.lower().removeprefix("www.") == "adhesaplate.com":
        path = parsed.path
        if path.startswith("/tag/"):
            path = "/blog/"
        elif path in ("/ul/", "/ul.html", "/ul-969/"):
            path = "/certifications/"
        else:
            slug = path.strip("/").split("/")[-1].removesuffix(".html")
            path = ROUTES.get(path, ROUTES.get("/" + slug + "/", path))
        if path == "/rohs/":
            path = "/certifications/"
        return path + ("#" + parsed.fragment if parsed.fragment else "")
    if value.startswith("/"):
        return ROUTES.get(value, ROUTES.get("/" + value.strip("/").split("/")[-1] + "/", value))
    return value


class Markdown(HTMLParser):
    def __init__(self, media: dict[str, str], lead_image: str | None):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.media = media
        self.lead_image = lead_image
        self.link_stack: list[str | None] = []
        self.skip = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]):
        attrs = dict(attrs)
        if tag in ("script", "style"):
            self.skip += 1
        if self.skip:
            return
        if tag in ("h1", "h2", "h3", "h4"):
            self.parts.append("\n\n" + "#" * max(2, int(tag[1])) + " ")
        elif tag in ("p", "div", "section", "table"):
            self.parts.append("\n\n")
        elif tag == "br":
            self.parts.append("\n")
        elif tag == "li":
            self.parts.append("\n- ")
        elif tag == "a":
            target = local_link(attrs.get("href") or "")
            self.link_stack.append(target if target and not target.startswith("#popup") else None)
            if self.link_stack[-1]:
                self.parts.append("[")
        elif tag == "img":
            src = attrs.get("src") or ""
            path = self.media.get(src)
            if path and src != self.lead_image:
                alt = clean_text(attrs.get("alt") or "")
                self.parts.append(f"\n\n![{alt}]({path})\n\n")

    def handle_endtag(self, tag: str):
        if tag in ("script", "style") and self.skip:
            self.skip -= 1
            return
        if self.skip:
            return
        if tag in ("h1", "h2", "h3", "h4", "p", "div", "section", "li", "table"):
            self.parts.append("\n\n")
        elif tag == "a" and self.link_stack:
            target = self.link_stack.pop()
            if target:
                self.parts.append(f"]({target})")

    def handle_data(self, data: str):
        if not self.skip:
            self.parts.append(clean_text(data))

    def result(self) -> str:
        result = "".join(self.parts)
        result = re.sub(r"\[([\s\S]*?)\]\(([^)]*)\)", lambda m: f"[{m[1].strip()}]({m[2]})", result)
        result = "\n".join(line.strip() for line in result.splitlines())
        result = re.sub(r"\n{3,}", "\n\n", result)
        result = re.sub(r"\[\s*\]\([^)]*\)", "", result)
        result = re.sub(r"(?m)^[ \t]*#{2,4}[ \t]*$", "", result)
        result = re.sub(r"(?m)^(#{2,4}) <\s*", r"\1 ", result)
        result = re.sub(r"(?m)^<\s*", "- ", result)
        result = re.sub(r"(?m)^•\s*", "- ", result)
        return result.strip()


def media_refs(body: str) -> list[tuple[str, str]]:
    refs = []
    for match in re.finditer(r"<img\b[^>]*>", body, re.I):
        tag = match.group(0)
        src = re.search(r"\bsrc=[\"']([^\"']+)", tag, re.I)
        width = re.search(r"\bwidth=[\"'](\d+)", tag, re.I)
        if not src or not width or int(width[1]) < 150:
            continue
        url = html.unescape(src[1])
        if urlparse(url).netloc.lower().removeprefix("www.") != "adhesaplate.com":
            continue
        if Path(urlparse(url).path).name.lower() in BADGES:
            continue
        refs.append((url, Path(urlparse(url).path).name))
    return refs


def section(path: str, post_type: str) -> str:
    if post_type == "post":
        return "blog"
    first = path.strip("/").split("/")[0]
    return first if first in ("products", "industries", "materials", "capabilities") else "utility"


def main(xml_file: Path, archive_file: Path) -> None:
    items = ET.parse(xml_file).getroot().find("channel").findall("item")
    for item in items:
        if item.findtext("wp:post_type", default="", namespaces=NS) in ("page", "post"):
            route = urlparse(item.findtext("link") or "").path
            if route:
                ROUTES["/" + route.strip("/").split("/")[-1] + "/"] = route
    count = 0
    copied: set[str] = set()
    missing: set[str] = set()
    with zipfile.ZipFile(archive_file) as archive:
        names = set(archive.namelist())
        for item in items:
            typ = item.findtext("wp:post_type", default="", namespaces=NS)
            status = item.findtext("wp:status", default="", namespaces=NS)
            if typ not in ("page", "post") or status != "publish":
                continue
            path = urlparse(item.findtext("link") or "").path
            if path in HAND_BUILT:
                continue
            if not path.endswith("/"):
                path += "/"
            title = clean_text(item.findtext("title") or "Untitled")
            raw = item.findtext("content:encoded", default="", namespaces=NS)
            # Elementor put the same contact block and quote popup on most pages.
            raw = re.split(r"<h2[^>]*>\s*(?:<strong>)?Contact Us:", raw, maxsplit=1, flags=re.I)[0]
            raw = re.sub(r"<a\b[^>]*href=[\"']#popup1[\"'][^>]*>[\s\S]*?</a>", "", raw, flags=re.I)
            raw = re.sub(r"\[(?:/?av_[^\]]*|mlw_quizmaster[^\]]*)\]", "", raw)
            for url in re.findall(r"href=[\"']([^\"']+\.pdf)[\"']", raw, flags=re.I):
                rel = urlparse(html.unescape(url)).path.split("/wp-content/uploads/", 1)[-1]
                member = "public_html/wp-content/uploads/" + rel
                if member in names:
                    destination = MEDIA / rel
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    if not destination.exists():
                        destination.write_bytes(archive.read(member))
                    copied.add(str(destination.relative_to(ROOT)))
            refs = media_refs(raw)
            media: dict[str, str] = {}
            for url, name in refs:
                rel = unquote(urlparse(url).path).lstrip("/")
                member = "public_html/" + rel
                if member not in names:
                    missing.add(member)
                    continue
                destination = MEDIA / rel.removeprefix("wp-content/uploads/")
                destination.parent.mkdir(parents=True, exist_ok=True)
                if not destination.exists():
                    destination.write_bytes(archive.read(member))
                copied.add(str(destination.relative_to(ROOT)))
                media[url] = "/legacy-media/" + str(destination.relative_to(MEDIA)).replace("\\", "/")
            lead = refs[0][0] if refs and refs[0][0] in media else None
            parser = Markdown(media, lead)
            parser.feed(raw)
            body = parser.result()
            if body.lower().startswith("## " + title.lower()):
                body = body.split("\n", 1)[-1].strip()
            if not body:
                body = "This page is part of the legacy site. Its interactive content is being redesigned for the next phase."
            plain = re.sub(r"!?\[([^]]*)\]\([^)]*\)|[#*_]", r"\1", body)
            plain = re.sub(r"\s+", " ", plain).strip()
            description = plain[:197].rsplit(" ", 1)[0].rstrip(" ,.;:") + ("..." if len(plain) > 197 else "")
            meta = {
                "title": title,
                "description": description or title,
                "path": path,
                "section": section(path, typ),
                "source": "WordPress export, 2026-10-12",
            }
            if lead:
                # Frontmatter image() expects a source-relative asset, so use a
                # copy under src/assets rather than the public media URL.
                public_path = ROOT / "website/public" / media[lead].lstrip("/")
                asset_path = ROOT / "website/src/assets/img/imported" / public_path.relative_to(MEDIA)
                asset_path.parent.mkdir(parents=True, exist_ok=True)
                if not asset_path.exists():
                    asset_path.write_bytes(public_path.read_bytes())
                target_dir = CONTENT / meta["section"]
                meta["image"] = Path(__import__("os").path.relpath(asset_path, target_dir)).as_posix()
                meta["imageAlt"] = title
            pubdate = item.findtext("wp:post_date", default="", namespaces=NS)
            if typ == "post" and pubdate and pubdate != "0000-00-00 00:00:00":
                meta["date"] = pubdate[:10]
            out = CONTENT / meta["section"] / (path.strip("/").split("/")[-1] + ".md")
            # Keep subsequent editorial improvements to imported pages.
            if out.exists():
                continue
            out.parent.mkdir(parents=True, exist_ok=True)
            frontmatter = "\n".join(f"{key}: {json.dumps(value, ensure_ascii=False)}" for key, value in meta.items())
            out.write_text(f"---\n{frontmatter}\n---\n\n{body}\n", encoding="utf-8", newline="\n")
            count += 1
    print(f"Created {count} pages/posts, copied {len(copied)} unique public media files.")
    if missing:
        print("Missing archive media:", *sorted(missing), sep="\n  ")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(Path(sys.argv[1]), Path(sys.argv[2]))
