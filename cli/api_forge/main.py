import sys
from pathlib import Path
import click
import yaml
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box
from api_forge.parser import parse
from api_forge.openapi import build_openapi

console = Console()

METHOD_COLORS = {
    "GET": "cyan", "POST": "green", "PUT": "yellow",
    "DELETE": "red", "PATCH": "magenta",
}


@click.group()
def cli():
    """⚡ API Forge — analyze Spring Boot projects and generate API docs."""


@cli.command()
@click.argument("path", default=".", type=click.Path(exists=True, file_okay=False))
@click.option("--export", "export_path", default=None, help="Also write openapi.yaml to this path")
def analyze(path: str, export_path: str | None):
    """Parse a Spring Boot project and print a summary table."""
    project_path = Path(path).resolve()
    project_name = project_path.name

    with console.status(f"[bold green]Scanning {project_path} ...[/]"):
        result = parse(project_path)

    endpoints = result["endpoints"]
    dtos = result["dtos"]

    if not endpoints:
        console.print(Panel("[yellow]No Spring Boot endpoints found.[/]\nMake sure the path contains .java files with @RestController.", title="⚠ No results"))
        sys.exit(1)

    # Endpoint table
    table = Table(title=f"📄 {project_name} — {len(endpoints)} endpoints", box=box.ROUNDED, show_lines=False)
    table.add_column("Method", style="bold", width=8)
    table.add_column("Path", style="white")
    table.add_column("Controller", style="dim")
    table.add_column("Auth", justify="center", width=6)
    table.add_column("Params", justify="right", width=6)

    for ep in sorted(endpoints, key=lambda e: e["path"]):
        color = METHOD_COLORS.get(ep["http_method"], "white")
        table.add_row(
            f"[{color}]{ep['http_method']}[/]",
            ep["path"],
            ep["controller_name"] or "—",
            "🔐" if ep["auth_required"] else "—",
            str(len(ep["parameters"])),
        )

    console.print(table)
    console.print(f"[dim]DTOs found: {len(dtos)}  |  Java files scanned: {result['file_count']}[/]")

    if export_path:
        _write_yaml(project_name, result, Path(export_path))


@cli.command()
@click.argument("path", default=".", type=click.Path(exists=True, file_okay=False))
@click.option("-o", "--output", default="openapi.yaml", show_default=True, help="Output file path")
@click.option("--name", default=None, help="API name (defaults to directory name)")
def export(path: str, output: str, name: str | None):
    """Generate an OpenAPI 3.0 YAML spec from a Spring Boot project."""
    project_path = Path(path).resolve()
    project_name = name or project_path.name

    with console.status("[bold green]Parsing project...[/]"):
        result = parse(project_path)

    if not result["endpoints"]:
        console.print("[red]No endpoints found. Nothing to export.[/]")
        sys.exit(1)

    out = Path(output)
    _write_yaml(project_name, result, out)


@cli.command()
@click.argument("path", default=".", type=click.Path(exists=True, file_okay=False))
def report(path: str):
    """Print a concise endpoint + DTO report for a Spring Boot project."""
    project_path = Path(path).resolve()

    with console.status("[bold green]Parsing...[/]"):
        result = parse(project_path)

    endpoints = result["endpoints"]
    dtos = result["dtos"]

    # Method count summary
    counts: dict = {}
    for ep in endpoints:
        counts[ep["http_method"]] = counts.get(ep["http_method"], 0) + 1

    summary_lines = "  ".join(
        f"[{METHOD_COLORS.get(m, 'white')}]{m}[/] [bold]{c}[/]"
        for m, c in sorted(counts.items())
    )
    console.print(Panel(summary_lines or "No endpoints", title=f"⚡ {project_path.name}", subtitle=f"{len(endpoints)} endpoints · {len(dtos)} DTOs · {result['file_count']} files"))

    # Auth summary
    auth_count = sum(1 for ep in endpoints if ep["auth_required"])
    if auth_count:
        console.print(f"  🔐 [yellow]{auth_count}[/] endpoint(s) require authentication")

    # DTO list
    if dtos:
        dto_table = Table(box=box.SIMPLE, show_header=True, header_style="bold dim")
        dto_table.add_column("DTO")
        dto_table.add_column("Type")
        dto_table.add_column("Fields", justify="right")
        for dto in dtos:
            dto_table.add_row(dto["name"], dto["dto_type"] or "—", str(len(dto["fields"])))
        console.print(dto_table)


def _write_yaml(project_name: str, result: dict, out: Path) -> None:
    spec = build_openapi(project_name, result)
    out.write_text(yaml.dump(spec, default_flow_style=False, sort_keys=False), encoding="utf-8")
    console.print(f"[green]✓[/] OpenAPI spec written to [bold]{out}[/]  ({len(result['endpoints'])} endpoints)")
