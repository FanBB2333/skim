package model

// Environment is a named collection of skills.
type Environment struct {
	Name   string   `yaml:"name"`
	Skills []string `yaml:"skills"`
}
