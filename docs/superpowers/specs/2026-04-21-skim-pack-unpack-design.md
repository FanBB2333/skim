# skim Pack/Unpack Design

## Goal

Add `skim pack` and `skim unpack` so a user can export the current skim skill runtime environment from one device and import it on another device.

## Commands

`skim pack [-o <archive>] [--env <name>]` writes a gzipped tar archive. Without `--env`, it includes every skill in `~/.skim/store` and every environment in `~/.skim/envs`. With `--env`, it includes only that environment file and the skills referenced by it.

`skim unpack <archive> [--force]` imports an archive into the current machine's `~/.skim` directory. By default it refuses to overwrite existing skills, environments, or `config.yaml`. With `--force`, it overwrites only paths contained in the archive.

## Archive Format

The archive is a `.tar.gz` with this layout:

```text
manifest.yaml
config.yaml
store/<skill-name>/...
envs/<env-name>.yaml
```

`manifest.yaml` records:

- `format`: stable pack format identifier, starting with `skim-pack-v1`
- `format_version`: integer version, starting with `1`
- `skim_version`: version read from the repository `VERSION` file or a runtime fallback
- `packed_at`: RFC3339 timestamp
- `scope`: `all` or `env`
- `environment`: selected environment name when scope is `env`
- `skills`: sorted list of packed skills
- `envs`: sorted list of packed environments
- `symlink_mode`: `dereference`
- `symlinks`: records for symlink paths that were materialized into regular archive entries

## Symlink Handling

Skill directories may contain files or directories that are symbolic links. For migration, `pack` always dereferences them:

- A symlink to a file is archived as a regular file with the target file's contents.
- A symlink to a directory is archived as a regular directory with recursively archived target contents.
- A broken symlink fails the pack operation with a clear error.
- The original link path and target are recorded in the manifest for diagnostics.

This avoids archives that reference absolute paths on the source device.

## Import Behavior

`unpack` extracts into a temporary directory, validates `manifest.yaml`, then copies archive content into the target skim directory. The command creates `~/.skim/store` and `~/.skim/envs` if needed.

The command does not restore active deployment state. After unpacking, users should run `skim activate <env>` on the target machine.

## Testing

Tests cover:

- `pack -> unpack -> activate` across two temporary HOME directories.
- Manifest fields include format and pack time.
- Symlinked files and directories inside a skill become real files/directories after unpack.
- Default overwrite protection rejects existing paths.
- `--force` allows archive-owned paths to be replaced.
- `--env` packs only the selected environment and referenced skills.
