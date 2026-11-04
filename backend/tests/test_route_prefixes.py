"""Guards against the doubled /api/api/... prefix.

notifications.py writes the full /api/... path on every route, so main.py must include it with NO prefix.
Mounting it with prefix="/api" (as integration-v2 did) serves /api/api/account/notifications, and the
frontend's NotificationCenter calls /api/account/notifications, which then answers 404.

The checks read the source files instead of importing app.main: importing it registers the order status
hooks globally, which would leak into the other order tests.
"""
import re
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / "app"


def _route_paths(module: str) -> list[str]:
    source = (APP / "routers" / f"{module}.py").read_text(encoding="utf-8")
    return re.findall(r'@router\.(?:get|post|put|patch|delete)\(\s*"([^"]+)"', source)


def _include_lines(module: str) -> list[str]:
    source = (APP / "main.py").read_text(encoding="utf-8")
    return [line.strip() for line in source.splitlines() if re.search(rf"include_router\(\s*{module}\.router", line)]


def test_notification_routes_already_start_with_api():
    paths = _route_paths("notifications")
    assert paths, "no notification routes found"
    assert all(p.startswith("/api/") for p in paths), paths


def test_notifications_are_mounted_without_a_prefix():
    lines = _include_lines("notifications")
    assert len(lines) == 1, lines
    assert "prefix" not in lines[0], f"notifications.router must not get a prefix: {lines[0]}"


def test_no_router_with_full_api_paths_gets_an_extra_api_prefix():
    """Any router whose routes already start with /api must be included without prefix="/api"."""
    for router_file in (APP / "routers").glob("*.py"):
        module = router_file.stem
        paths = _route_paths(module)
        if paths and all(p.startswith("/api") for p in paths):
            for line in _include_lines(module):
                assert 'prefix="/api"' not in line, f"{module}: routes already start with /api -> {line}"
