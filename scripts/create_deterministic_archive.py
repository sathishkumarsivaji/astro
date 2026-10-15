import subprocess
import sys
import zipfile
from pathlib import Path


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: create_deterministic_archive.py OUTPUT.zip")

    root = Path(__file__).resolve().parent.parent
    output = root / sys.argv[1]
    tracked = subprocess.check_output(
        ["git", "ls-files", "-z"], cwd=root
    ).decode("utf-8").split("\0")

    members = []
    for relative in tracked:
        if not relative:
            continue
        attr = subprocess.check_output(
            ["git", "check-attr", "export-ignore", "--", relative],
            cwd=root,
            text=True,
        ).strip()
        if attr.endswith(": set"):
            continue
        members.append(relative)

    members.sort()
    with zipfile.ZipFile(
        output,
        "w",
        compression=zipfile.ZIP_DEFLATED,
        compresslevel=9,
    ) as archive:
        for relative in members:
            content = subprocess.check_output(
                ["git", "show", f"HEAD:{relative}"], cwd=root
            )
            info = zipfile.ZipInfo(relative)
            info.date_time = (2000, 1, 1, 0, 0, 0)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, content)


if __name__ == "__main__":
    main()
