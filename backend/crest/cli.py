import argparse
import sys
from . import config, auth, profiles, launcher, logs, updater, versions
from .mods import modrinth, manager, modloader


def main():
    parser = argparse.ArgumentParser(prog="crest", description="Crest Launcher - Minecraft launcher with mod support")
    sub = parser.add_subparsers(dest="command")

    # login
    login_p = sub.add_parser("login", help="Authenticate with Minecraft")
    login_p.add_argument("method", nargs="?", choices=["offline", "microsoft"], default="offline")
    login_p.add_argument("username", nargs="?", help="Username (for offline mode)")

    # logout
    sub.add_parser("logout", help="Clear saved credentials")

    # status
    sub.add_parser("status", help="Show login status")

    # profiles
    sub.add_parser("profiles", help="List profiles")
    prof_p = sub.add_parser("profile", help="Manage profiles")
    prof_sub = prof_p.add_subparsers(dest="action")
    pc = prof_sub.add_parser("create", help="Create a profile")
    pc.add_argument("name")
    pc.add_argument("version")
    pc.add_argument("--modloader", choices=["fabric", "forge", None], default=None)
    pc.add_argument("--java-args", nargs="+", default=["-Xmx4G", "-Xms512M"])
    pc.add_argument("--width", type=int, default=854)
    pc.add_argument("--height", type=int, default=480)

    pd = prof_sub.add_parser("delete", help="Delete a profile")
    pd.add_argument("name")

    # launch
    launch_p = sub.add_parser("launch", help="Launch a profile")
    launch_p.add_argument("profile", nargs="?", default=None)
    launch_p.add_argument("--profile", "-p", dest="profile_opt", help="Profile name (alternative)")

    # versions
    ver_p = sub.add_parser("versions", help="List available Minecraft versions")
    ver_p.add_argument("--type", choices=["release", "snapshot", "old_beta", "old_alpha"], default=None, help="Filter by type")

    # mods
    mod_p = sub.add_parser("mod", help="Manage mods for a profile")
    mod_sub = mod_p.add_subparsers(dest="action")
    ms = mod_sub.add_parser("search", help="Search mods on Modrinth")
    ms.add_argument("query")
    ms.add_argument("--version", default=None)
    ms.add_argument("--loader", default=None)
    ms.add_argument("--limit", type=int, default=10)

    mi = mod_sub.add_parser("install", help="Install a mod from Modrinth")
    mi.add_argument("profile")
    mi.add_argument("slug")
    mi.add_argument("--loader", default="fabric")

    mr = mod_sub.add_parser("remove", help="Remove a mod")
    mr.add_argument("profile")
    mr.add_argument("slug")

    ml = mod_sub.add_parser("list", help="List installed mods")
    ml.add_argument("profile")

    mt = mod_sub.add_parser("toggle", help="Enable/disable a mod")
    mt.add_argument("profile")
    mt.add_argument("slug")
    mt.add_argument("--enable", action="store_true", default=None)
    mt.add_argument("--disable", action="store_true", default=None)

    # logs
    log_p = sub.add_parser("logs", help="View game logs")
    log_p.add_argument("profile", nargs="?", default=None)
    log_p.add_argument("--lines", type=int, default=50)

    # update
    sub.add_parser("update", help="Check for launcher updates")

    args = parser.parse_args()

    try:
        _dispatch(args)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def _dispatch(args):
    if args.command == "login":
        if args.method == "offline":
            if not args.username:
                print("Usage: crest login offline <username>")
                return
            a = auth.login_offline(args.username)
            print(f"Logged in as offline player: {a['username']}")
        elif args.method == "microsoft":
            cli_cfg = {}
            if config.CONFIG_FILE.exists():
                import json
                cli_cfg = json.loads(config.CONFIG_FILE.read_text())
            cid = cli_cfg.get("microsoft_client_id")
            a = auth.login_microsoft(client_id=cid)
            print(f"Logged in as: {a['username']} (Microsoft)")

    elif args.command == "logout":
        auth.logout()
        print("Logged out")

    elif args.command == "status":
        a = auth.get_auth()
        if a:
            print(f"Logged in as: {a['username']} ({a['type']})")
        else:
            print("Not logged in")

    elif args.command == "profiles":
        for p in profiles.list_profiles():
            mod_info = f" [{p.get('modloader', 'vanilla')}]" if p.get('modloader') else " [vanilla]"
            print(f"  {p['name']} - MC {p['version']}{mod_info}")

    elif args.command == "profile":
        if args.action == "create":
            profiles.create_profile(
                args.name, args.version,
                modloader=args.modloader,
                java_args=args.java_args,
                resolution={"width": args.width, "height": args.height},
            )
            print(f"Created profile '{args.name}' (MC {args.version})")
        elif args.action == "delete":
            profiles.delete_profile(args.name)
            print(f"Deleted profile '{args.name}'")

    elif args.command == "launch":
        pname = args.profile or args.profile_opt
        if not pname:
            profiles_ = profiles.list_profiles()
            if len(profiles_) == 1:
                pname = profiles_[0]["name"]
            elif len(profiles_) == 0:
                print("No profiles found. Create one with 'crest profile create <name> <version>'")
                return
            else:
                print("Multiple profiles found. Specify one:")
                for p in profiles_:
                    print(f"  crest launch {p['name']}")
                return
        launcher.launch(pname)

    elif args.command == "versions":
        for v in versions.list_versions(args.type):
            print(f"  {v['id']} ({v['type']})")

    elif args.command == "mod":
        if args.action == "search":
            results = modrinth.search(args.query, args.version, args.loader, args.limit)
            if not results:
                print("No results found")
                return
            for r in results:
                print(f"  {r['slug']:30s} {r.get('title', ''):40s} ⭐{r.get('follows', 0)}")
        elif args.action == "install":
            m = manager.install_mod(args.profile, args.slug, None, args.loader)
            print(f"Installed {args.slug} ({m['filename']})")
        elif args.action == "remove":
            manager.remove_mod(args.profile, args.slug)
            print(f"Removed {args.slug}")
        elif args.action == "list":
            for m in manager.list_mods(args.profile):
                status = "✓" if m["enabled"] else "✗"
                print(f"  {status} {m['slug']:25s} {m.get('filename', '')}")
        elif args.action == "toggle":
            if args.enable:
                manager.toggle_mod(args.profile, args.slug, True)
            elif args.disable:
                manager.toggle_mod(args.profile, args.slug, False)
            else:
                m = manager.toggle_mod(args.profile, args.slug)
                status = "enabled" if m["enabled"] else "disabled"
                print(f"{args.slug} {status}")

    elif args.command == "logs":
        log_list = logs.list_logs(args.profile)
        if not log_list:
            print("No logs found")
            return
        latest = log_list[0]
        with open(latest) as f:
            lines = f.readlines()
        tail = lines[-args.lines:] if len(lines) > args.lines else lines
        print(f"--- {latest.name} (last {len(tail)} lines) ---")
        for line in tail:
            print(line, end="")

    elif args.command == "update":
        up = updater.check_update()
        if up:
            print(f"Update available: {up['version']}")
            print(f"  {up['url']}")
        else:
            print("No updates available")

    else:
        print("Use -h for help")
