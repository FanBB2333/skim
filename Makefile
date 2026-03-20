.PHONY: build build-gui install clean test vet fmt all

BINARY := skim
BUILD_DIR := ./cmd/skim
GUI_DIR := ./cmd/skim-gui

# Build CLI only
build:
	go build -o $(BINARY) $(BUILD_DIR)

# Build GUI (requires Wails)
build-gui:
	cd $(GUI_DIR) && wails build

# Build both CLI and GUI
build-all: build build-gui

# Install CLI to $GOPATH/bin
install: build
	mv $(BINARY) $(GOPATH)/bin/$(BINARY) 2>/dev/null || mv $(BINARY) ~/go/bin/$(BINARY) || mv $(BINARY) /usr/local/bin/$(BINARY)

# Clean build artifacts
clean:
	rm -f $(BINARY)
	rm -rf $(GUI_DIR)/build/bin
	go clean

# Run tests
test:
	go test ./...

# Run go vet
vet:
	go vet ./...

# Run go fmt
fmt:
	go fmt ./...

# Development: Run GUI in dev mode
dev-gui:
	cd $(GUI_DIR) && wails dev

# Full build pipeline
all: vet fmt build
