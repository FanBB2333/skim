package linker

// Linker abstracts file operations for deploying skills.
// The default implementation copies files; a future implementation can use hard links.
type Linker interface {
	// LinkDir copies/links the src directory tree into dst.
	LinkDir(src, dst string) error

	// UnlinkDir removes a previously linked directory.
	UnlinkDir(path string) error

	// IsManaged checks if a path was placed by skim (has .skim-managed marker).
	IsManaged(path string) (bool, error)
}
