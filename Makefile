PACKAGE_NAME = xulman

all: xpi

xpi: makexpi/makexpi.sh
	cp makexpi/makexpi.sh ./
	./makexpi.sh -n $(PACKAGE_NAME) -o
	rm ./makexpi.sh

makexpi/makexpi.sh:
	git submodule update --init
