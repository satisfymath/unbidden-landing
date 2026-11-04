"""Records what the real terminal app (unbidden.tui) prints, for the replay on the landing page.

Runs UnbiddenApp headless on *copies* of archived workspaces and writes src/content/tui-recording.json: each row is
the app's own segments with their style, so the page replays exactly what the product says. It starts no agent and
calls no model. Needs an environment with unbidden installed, and these copies (with a git repository around them):

    python -I scripts/tui/record.py <fst copy> <copy with an open question> <fresh repository> <out.json>

Run it with UNBIDDEN_LANG=en and HOME pointing at an empty directory. The copies used and their sources are in
docs/CONTENT_SOURCES.md.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

from textual.widgets import Input, OptionList, Static

from unbidden import __version__
from unbidden.tui.app import UnbiddenApp
from unbidden.tui.widgets import Feed, Header, StatusBar
from unbidden.workspace import Workspace

WIDE = (190, 60)  # wide enough that the app does not wrap: the page wraps instead


def seg(s: Any) -> dict[str, Any]:
    out: dict[str, Any] = {"t": s.text}
    st = s.style
    if st is not None:
        if st.bold:
            out["b"] = 1
        if st.dim:
            out["d"] = 1
        if st.color is not None and st.color.triplet is not None and st.color.triplet.hex.lower() == "#f5b700":
            out["a"] = 1
    return out


def rows(feed: Feed, start: int = 0) -> list[list[dict[str, Any]]]:
    out = []
    for line in feed.lines[start:]:
        parts = [seg(s) for s in line]
        while parts and not parts[-1]["t"].strip():
            parts.pop()
        if parts:
            parts[-1]["t"] = parts[-1]["t"].rstrip()
        out.append(parts)
    return out


def heal(rows_in: list[list[dict[str, Any]]]) -> list[list[dict[str, Any]]]:
    """The app wraps at the terminal's width; the page wraps by itself. A continuation is a row that starts at column
    0 under a row that has text and is not a heading."""
    out: list[list[dict[str, Any]]] = []
    for row in rows_in:
        text = "".join(p["t"] for p in row)
        if out and text and not text[0].isspace() and not text.startswith(">"):
            prev = "".join(p["t"] for p in out[-1])
            if prev.startswith(" "):
                out[-1] = [*out[-1], {**(row[0] if row else {}), "t": " "}, *row]
                continue
        out.append(row)
    return out


def panel(app: Any) -> list[str]:
    """The text of the panel on top, line by line."""
    lines: list[str] = []
    from rich.console import Console

    console = Console(width=120, record=True, file=open(os.devnull, "w"), color_system=None)  # noqa: SIM115
    for w in app.screen.query(Static):
        body = w.render()
        renderable = getattr(body, "_renderable", None)
        if renderable is not None:
            console.print(renderable)
        else:
            console.print(str(body), markup=False)
    lines.extend(console.export_text().split("\n"))
    return [line.rstrip() for line in lines if line.strip()]


def markup(line: str) -> str:
    return re.sub(r"\[/?[^\]]*\]", "", line).strip()


async def record_fst(path: Path) -> dict[str, Any]:
    os.chdir(path)
    app = UnbiddenApp(Workspace.find(), planner="rule")
    data: dict[str, Any] = {"commands": {}}
    async with app.run_test(size=WIDE) as pilot:
        await pilot.pause(1.5)
        feed = app.query_one(Feed)
        data["header"] = markup(app.query_one(Header).line)
        data["header"] = re.sub(r"\s{2,}", "  ", data["header"])
        data["bar"] = markup(app.query_one(StatusBar).line)
        data["open"] = heal(rows(feed))
        first = next(re.search(r"opp_\w+", "".join(p["t"] for p in r)).group(0)  # type: ignore[union-attr]
                     for r in data["open"] if re.search(r"opp_\w+", "".join(p["t"] for p in r)))  # fmt: skip
        data["first_opportunity"] = first
        for command in ("/inbox", f"/why {first}", "/activity", "/help", "/kill recorded for the page", "/resume"):
            mark = len(feed.lines)
            await pilot.press(*command, "enter")
            await pilot.pause(1.0)
            key = command.split()[0]
            entry: dict[str, Any] = {"typed": command, "rows": heal(rows(feed, mark))}
            if type(app.screen).__name__ == "PanelScreen":
                entry["panel"] = panel(app)
                await pilot.press("escape")
                await pilot.pause(0.3)
            data["commands"][key] = entry
            if key == "/kill":
                data["bar_killed"] = markup(app.query_one(StatusBar).line)
    return data


async def record_ask(path: Path) -> dict[str, Any]:
    """The monthly-cap question as the product writes it (director.asks.for_spend), at the US$2 default cap campaign 12
    hit on spoolman. It is opened on the copy and answered both ways there, to record what the app says back."""
    from unbidden.director.asks import for_spend, open_ask

    os.chdir(path)
    db = path / ".unbidden" / "state.db"
    saved = db.read_bytes()
    out: dict[str, Any] = {}
    for option, value in (("later", None), ("raise", "10")):
        db.write_bytes(saved)
        ws = Workspace.find()
        store = ws.store()
        open_ask(store, for_spend(2.0, 2.0))
        store.close()
        app = UnbiddenApp(ws, planner="rule")
        async with app.run_test(size=WIDE) as pilot:
            await pilot.pause(1.5)
            mark = len(app.query_one(Feed).lines)
            await pilot.press(*"/ask", "enter")
            await pilot.pause(1.0)
            screen = app.screen
            box = screen.query_one(OptionList)
            out["screen"] = type(screen).__name__
            out["text"] = [t for t in (markup(str(w.render())) for w in screen.query(Static)) if t]
            out["options"] = [markup(str(o.prompt)) for o in box.options]
            box.highlighted = 0 if option == "raise" else 1
            await pilot.pause(0.2)
            await pilot.press("enter")
            await pilot.pause(0.6)
            if value:
                await pilot.press(*value, "enter")
            await pilot.pause(1.5)
            out[option] = heal(rows(app.query_one(Feed), mark))
    db.write_bytes(saved)
    return out


async def record_setup(path: Path) -> list[dict[str, Any]]:
    os.chdir(path)
    app = UnbiddenApp(Workspace(path), planner="rule")
    steps: list[dict[str, Any]] = []
    async with app.run_test(size=WIDE) as pilot:
        await pilot.pause(3.0)
        for _ in range(4):
            screen = app.screen
            if type(screen).__name__ != "SetupScreen":
                break
            question = markup(str(screen.query_one("#question", Static).render()))
            box = screen.query_one("#choices", OptionList)
            options = [markup(str(o.prompt)) for o in box.options] if box.display else []
            field = screen.query(Input)
            placeholder = field.first().placeholder if field and not options else ""
            hint = markup(str(screen.query_one("#hint", Static).render()))
            steps.append({"question": question, "options": options, "placeholder": placeholder, "hint": hint})
            await pilot.press("down", "enter") if options else await pilot.press("enter")
            await pilot.pause(3.0)
    return steps


def main() -> None:
    fst, ask, fresh, out = (Path(a).resolve() for a in sys.argv[1:5])
    data = asyncio.run(record_fst(fst))
    data["ask"] = asyncio.run(record_ask(ask))
    data["setup"] = asyncio.run(record_setup(fresh))
    data["version"] = __version__
    out.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
