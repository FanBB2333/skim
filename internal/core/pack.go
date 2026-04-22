package core

import (
	"archive/tar"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/FanBB2333/skim/internal/config"
	"gopkg.in/yaml.v3"
)

const (
	PackFormat        = "skim-pack-v1"
	PackFormatVersion = 1
	symlinkMode       = "dereference"
)

type PackManager struct {
	store *StoreManager
	env   *EnvManager
}

func NewPackManager(store *StoreManager, env *EnvManager) *PackManager {
	return &PackManager{store: store, env: env}
}

type PackOptions struct {
	OutputPath  string
	EnvName     string
	SkimVersion string
	Now         func() time.Time
}

type UnpackOptions struct {
	ArchivePath string
	Force       bool
}

type PackResult struct {
	ArchivePath string
	Skills      []string
	Envs        []string
	Symlinks    []PackSymlink
}

type UnpackResult struct {
	Skills      []string
	Envs        []string
	WroteConfig bool
}

type unpackEntry struct {
	src  string
	dst  string
	kind string
	name string
}

type PackManifest struct {
	Format        string        `yaml:"format"`
	FormatVersion int           `yaml:"format_version"`
	SkimVersion   string        `yaml:"skim_version"`
	PackedAt      time.Time     `yaml:"packed_at"`
	Scope         string        `yaml:"scope"`
	Environment   string        `yaml:"environment,omitempty"`
	Skills        []string      `yaml:"skills"`
	Envs          []string      `yaml:"envs"`
	SymlinkMode   string        `yaml:"symlink_mode"`
	Symlinks      []PackSymlink `yaml:"symlinks,omitempty"`
}

type PackSymlink struct {
	Path       string `yaml:"path"`
	Target     string `yaml:"target"`
	TargetType string `yaml:"target_type"`
}

func (p *PackManager) Pack(opts PackOptions) (*PackResult, error) {
	if opts.Now == nil {
		opts.Now = time.Now
	}
	if opts.SkimVersion == "" {
		opts.SkimVersion = "dev"
	}
	now := opts.Now().UTC()

	skills, envs, scope, err := p.packSelection(opts.EnvName)
	if err != nil {
		return nil, err
	}

	outputPath := opts.OutputPath
	if outputPath == "" {
		outputPath = fmt.Sprintf("skim-pack-%s.tar.gz", now.Format("20060102-150405"))
	}
	outputPath, err = filepath.Abs(outputPath)
	if err != nil {
		return nil, err
	}

	stageDir, err := os.MkdirTemp("", "skim-pack-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(stageDir)

	var symlinks []PackSymlink
	configPath := filepath.Join(config.SkimDir(), "config.yaml")
	if _, err := os.Stat(configPath); err == nil {
		if err := copyPathDereference(configPath, filepath.Join(stageDir, "config.yaml"), "config.yaml", &symlinks); err != nil {
			return nil, fmt.Errorf("copy config: %w", err)
		}
	} else if !os.IsNotExist(err) {
		return nil, fmt.Errorf("stat config: %w", err)
	}

	for _, envName := range envs {
		src := filepath.Join(config.SkimDir(), "envs", envName+".yaml")
		dst := filepath.Join(stageDir, "envs", envName+".yaml")
		if err := copyPathDereference(src, dst, path.Join("envs", envName+".yaml"), &symlinks); err != nil {
			return nil, fmt.Errorf("copy environment %q: %w", envName, err)
		}
	}

	for _, skillName := range skills {
		src := filepath.Join(config.SkimDir(), "store", skillName)
		dst := filepath.Join(stageDir, "store", skillName)
		if err := copyPathDereference(src, dst, path.Join("store", skillName), &symlinks); err != nil {
			return nil, fmt.Errorf("copy skill %q: %w", skillName, err)
		}
	}

	manifest := PackManifest{
		Format:        PackFormat,
		FormatVersion: PackFormatVersion,
		SkimVersion:   opts.SkimVersion,
		PackedAt:      now,
		Scope:         scope,
		Environment:   opts.EnvName,
		Skills:        skills,
		Envs:          envs,
		SymlinkMode:   symlinkMode,
		Symlinks:      symlinks,
	}
	data, err := yaml.Marshal(manifest)
	if err != nil {
		return nil, err
	}
	if err := os.WriteFile(filepath.Join(stageDir, "manifest.yaml"), data, 0o644); err != nil {
		return nil, err
	}

	if err := os.MkdirAll(filepath.Dir(outputPath), 0o755); err != nil {
		return nil, err
	}
	if err := writeTarGz(stageDir, outputPath); err != nil {
		return nil, err
	}

	return &PackResult{
		ArchivePath: outputPath,
		Skills:      skills,
		Envs:        envs,
		Symlinks:    symlinks,
	}, nil
}

func (p *PackManager) Unpack(opts UnpackOptions) (*UnpackResult, error) {
	if opts.ArchivePath == "" {
		return nil, errors.New("archive path is required")
	}

	stageDir, err := os.MkdirTemp("", "skim-unpack-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(stageDir)

	if err := extractTarGz(opts.ArchivePath, stageDir); err != nil {
		return nil, err
	}

	manifest, err := readPackManifest(filepath.Join(stageDir, "manifest.yaml"))
	if err != nil {
		return nil, err
	}

	if err := config.EnsureDirs(); err != nil {
		return nil, err
	}

	result := &UnpackResult{
		Skills: append([]string(nil), manifest.Skills...),
		Envs:   append([]string(nil), manifest.Envs...),
	}

	var entries []unpackEntry
	if _, err := os.Stat(filepath.Join(stageDir, "config.yaml")); err == nil {
		entries = append(entries, unpackEntry{
			src:  filepath.Join(stageDir, "config.yaml"),
			dst:  filepath.Join(config.SkimDir(), "config.yaml"),
			kind: "config",
			name: "config.yaml",
		})
		result.WroteConfig = true
	} else if !os.IsNotExist(err) {
		return nil, err
	}

	for _, skillName := range manifest.Skills {
		if err := validatePackName(skillName); err != nil {
			return nil, fmt.Errorf("invalid skill name %q: %w", skillName, err)
		}
		src := filepath.Join(stageDir, "store", skillName)
		dst := filepath.Join(config.SkimDir(), "store", skillName)
		entries = append(entries, unpackEntry{src: src, dst: dst, kind: "skill", name: skillName})
	}

	for _, envName := range manifest.Envs {
		if err := validatePackName(envName); err != nil {
			return nil, fmt.Errorf("invalid environment name %q: %w", envName, err)
		}
		src := filepath.Join(stageDir, "envs", envName+".yaml")
		dst := filepath.Join(config.SkimDir(), "envs", envName+".yaml")
		entries = append(entries, unpackEntry{src: src, dst: dst, kind: "environment", name: envName})
	}

	if !opts.Force {
		for _, entry := range entries {
			if _, err := os.Lstat(entry.dst); err == nil {
				return nil, fmt.Errorf("import %s %q: %s already exists; use --force to overwrite", entry.kind, entry.name, entry.dst)
			} else if !os.IsNotExist(err) {
				return nil, err
			}
		}
	}

	for _, entry := range entries {
		if err := copyUnpackedPath(entry.src, entry.dst, opts.Force); err != nil {
			return nil, fmt.Errorf("import %s %q: %w", entry.kind, entry.name, err)
		}
	}

	return result, nil
}

func (p *PackManager) packSelection(envName string) ([]string, []string, string, error) {
	if envName != "" {
		if err := validatePackName(envName); err != nil {
			return nil, nil, "", err
		}
		envDef, err := p.env.Get(envName)
		if err != nil {
			return nil, nil, "", fmt.Errorf("load environment %q: %w", envName, err)
		}
		skills := uniqueSorted(envDef.Skills)
		for _, skillName := range skills {
			if err := validatePackName(skillName); err != nil {
				return nil, nil, "", fmt.Errorf("invalid skill name %q: %w", skillName, err)
			}
			if !p.store.Exists(skillName) {
				return nil, nil, "", fmt.Errorf("environment %q references missing skill %q", envName, skillName)
			}
		}
		return skills, []string{envName}, "env", nil
	}

	storeSkills, err := p.store.List()
	if err != nil {
		return nil, nil, "", err
	}
	skills := make([]string, 0, len(storeSkills))
	for _, skill := range storeSkills {
		if err := validatePackName(skill.Name); err != nil {
			return nil, nil, "", fmt.Errorf("invalid skill name %q: %w", skill.Name, err)
		}
		skills = append(skills, skill.Name)
	}
	sort.Strings(skills)

	envDefs, err := p.env.List()
	if err != nil {
		return nil, nil, "", err
	}
	envs := make([]string, 0, len(envDefs))
	for _, envDef := range envDefs {
		if err := validatePackName(envDef.Name); err != nil {
			return nil, nil, "", fmt.Errorf("invalid environment name %q: %w", envDef.Name, err)
		}
		envs = append(envs, envDef.Name)
	}
	sort.Strings(envs)

	return skills, envs, "all", nil
}

// maxPackSymlinkDepth caps how many chained symlinks copyPathDereference will
// follow, so cyclic or deeply indirected skills can't hang pack/unpack.
const maxPackSymlinkDepth = 40

func copyPathDereference(src, dst, archiveRel string, symlinks *[]PackSymlink) error {
	return copyPathDereferenceDepth(src, dst, archiveRel, symlinks, 0)
}

func copyPathDereferenceDepth(src, dst, archiveRel string, symlinks *[]PackSymlink, depth int) error {
	if depth > maxPackSymlinkDepth {
		return fmt.Errorf("symlink depth exceeded at %s (possible cycle)", src)
	}

	info, err := os.Lstat(src)
	if err != nil {
		return err
	}

	if info.Mode()&os.ModeSymlink != 0 {
		target, err := os.Readlink(src)
		if err != nil {
			return err
		}
		resolved, err := filepath.EvalSymlinks(src)
		if err != nil {
			return fmt.Errorf("resolve symlink %s -> %s: %w", src, target, err)
		}
		targetInfo, err := os.Stat(resolved)
		if err != nil {
			return err
		}
		targetType := "file"
		if targetInfo.IsDir() {
			targetType = "dir"
		}
		*symlinks = append(*symlinks, PackSymlink{
			Path:       filepath.ToSlash(archiveRel),
			Target:     target,
			TargetType: targetType,
		})
		return copyPathDereferenceDepth(resolved, dst, archiveRel, symlinks, depth+1)
	}

	if info.IsDir() {
		if err := os.MkdirAll(dst, info.Mode().Perm()); err != nil {
			return err
		}
		entries, err := os.ReadDir(src)
		if err != nil {
			return err
		}
		for _, entry := range entries {
			childSrc := filepath.Join(src, entry.Name())
			childDst := filepath.Join(dst, entry.Name())
			childRel := path.Join(filepath.ToSlash(archiveRel), entry.Name())
			// Pass depth through; only symlink resolution increments it so
			// normal deep directory trees aren't penalised.
			if err := copyPathDereferenceDepth(childSrc, childDst, childRel, symlinks, depth); err != nil {
				return err
			}
		}
		return nil
	}

	if !info.Mode().IsRegular() {
		return fmt.Errorf("unsupported file type at %s", src)
	}

	return copyFile(src, dst, info.Mode().Perm())
}

func writeTarGz(srcDir, archivePath string) error {
	f, err := os.Create(archivePath)
	if err != nil {
		return err
	}
	defer f.Close()

	gzw := gzip.NewWriter(f)
	defer gzw.Close()

	tw := tar.NewWriter(gzw)
	defer tw.Close()

	return filepath.WalkDir(srcDir, func(pathName string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if pathName == srcDir {
			return nil
		}

		info, err := d.Info()
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(srcDir, pathName)
		if err != nil {
			return err
		}
		hdr, err := tar.FileInfoHeader(info, "")
		if err != nil {
			return err
		}
		hdr.Name = filepath.ToSlash(rel)
		if err := tw.WriteHeader(hdr); err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		f, err := os.Open(pathName)
		if err != nil {
			return err
		}
		if _, err := io.Copy(tw, f); err != nil {
			f.Close()
			return err
		}
		return f.Close()
	})
}

func extractTarGz(archivePath, dstDir string) error {
	f, err := os.Open(archivePath)
	if err != nil {
		return err
	}
	defer f.Close()

	gzr, err := gzip.NewReader(f)
	if err != nil {
		return err
	}
	defer gzr.Close()

	tr := tar.NewReader(gzr)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		cleanName := path.Clean(hdr.Name)
		if cleanName == "." || strings.HasPrefix(cleanName, "../") || path.IsAbs(cleanName) {
			return fmt.Errorf("unsafe archive path %q", hdr.Name)
		}

		target := filepath.Join(dstDir, filepath.FromSlash(cleanName))
		if err := ensureInsideDir(dstDir, target); err != nil {
			return err
		}

		switch hdr.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(target, os.FileMode(hdr.Mode).Perm()); err != nil {
				return err
			}
		case tar.TypeReg, tar.TypeRegA:
			if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
				return err
			}
			out, err := os.OpenFile(target, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, os.FileMode(hdr.Mode).Perm())
			if err != nil {
				return err
			}
			if _, err := io.Copy(out, tr); err != nil {
				out.Close()
				return err
			}
			if err := out.Close(); err != nil {
				return err
			}
		default:
			return fmt.Errorf("unsupported archive entry %q", hdr.Name)
		}
	}

	return nil
}

func readPackManifest(path string) (*PackManifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read manifest: %w", err)
	}
	var manifest PackManifest
	if err := yaml.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("parse manifest: %w", err)
	}
	if manifest.Format != PackFormat {
		return nil, fmt.Errorf("unsupported pack format %q", manifest.Format)
	}
	if manifest.FormatVersion != PackFormatVersion {
		return nil, fmt.Errorf("unsupported pack format version %d", manifest.FormatVersion)
	}
	if manifest.SymlinkMode != symlinkMode {
		return nil, fmt.Errorf("unsupported symlink mode %q", manifest.SymlinkMode)
	}
	return &manifest, nil
}

func copyUnpackedPath(src, dst string, force bool) error {
	if _, err := os.Lstat(dst); err == nil {
		if !force {
			return fmt.Errorf("%s already exists; use --force to overwrite", dst)
		}
		if err := os.RemoveAll(dst); err != nil {
			return err
		}
	} else if !os.IsNotExist(err) {
		return err
	}

	var symlinks []PackSymlink
	return copyPathDereference(src, dst, "", &symlinks)
}

func ensureInsideDir(base, target string) error {
	rel, err := filepath.Rel(base, target)
	if err != nil {
		return err
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return fmt.Errorf("path %s escapes %s", target, base)
	}
	return nil
}

func validatePackName(name string) error {
	if name == "" {
		return errors.New("name is empty")
	}
	if name == "." || name == ".." {
		return errors.New("name must not be '.' or '..'")
	}
	if filepath.Base(name) != name || strings.ContainsAny(name, `/\`) {
		return errors.New("name must not contain path separators")
	}
	return nil
}

func uniqueSorted(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	sort.Strings(result)
	return result
}
