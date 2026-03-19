.PHONY: build install clean test vet

BINARY := skim
BUILD_DIR := ./cmd/skim

build:
	go build -o $(BINARY) $(BUILD_DIR)

install: build
	mv $(BINARY) $(GOPATH)/bin/$(BINARY) 2>/dev/null || mv $(BINARY) ~/go/bin/$(BINARY) || mv $(BINARY) /usr/local/bin/$(BINARY)

clean:
	rm -f $(BINARY)
	go clean

test:
	go test ./...

vet:
	go vet ./...

fmt:
	go fmt ./...

all: vet fmt build
