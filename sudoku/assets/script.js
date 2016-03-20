"use strict";

function Sudoku(nodeList) {
	// capture the DOM elements
	this.gridElem = [].slice.call(nodeList);

	// extract grid values
	// zero for unknown
	this.grid = [];
	this.grid = this.gridElem.map(function (cell) {
		return parseInt(cell.value) || 0;
	});

	// validations
	if (this.grid.length != 81) throw "Invalid: length";
	if (this.hasDuplicates()) throw "Invalid: duplicates";
}

Sudoku.prototype.toString = function() {
	var output = [];
	for (var i = 0; i < 9; i++) {
		output.push(this.grid.slice(i*9, (i+1)*9).join(""));
	}
	return output.join("\n");
}

// simulating getting cell from 2-D grid
Sudoku.prototype.get = function(row, col) {
	return this.grid[row*9 + col];
}

// simulating setting cell to 2-D grid
Sudoku.prototype.set = function(row, col, value) {
	value = parseInt(value);
	if (value < 0 || value > 9 || isNaN(value)) throw "Invalid: value must be 0-9";
	this.grid[row*9 + col] = value;
	this.gridElem[row*9 + col].value = value;
}

// unknown cell generator
Sudoku.prototype.eachUnknown = function*() {
	var BoxOfIndex = [
		0,0,0,1,1,1,2,2,2,0,0,0,1,1,1,2,2,2,0,0,0,1,1,1,2,2,2,
		3,3,3,4,4,4,5,5,5,3,3,3,4,4,4,5,5,5,3,3,3,4,4,4,5,5,5,
		6,6,6,7,7,7,8,8,8,6,6,6,7,7,7,8,8,8,6,6,6,7,7,7,8,8,8
	];
	for (var row = 0; row < 9; row++) {
		for (var col = 0; col < 9; col++) {
			let index = row*9 + col;
			if (this.grid[index] != 0) continue;
			let box = BoxOfIndex[index];
			yield {"row": row, "col": col, "box": box};
		}
	}
}

// is there duplicates in any row, column, or box
Sudoku.prototype.hasDuplicates = function() {
	function uniq(array) {
		return array.sort().every(function(elem, index) {
			return elem !== array[index-1];
		});
	}

	for (var i = 0; i < 9; i++) {
		if (!uniq(this.rowdigits(i))) return true;
		if (!uniq(this.coldigits(i))) return true;
		if (!uniq(this.boxdigits(i))) return true;
	}

	return false;
}

// find all possible values for a cell
Sudoku.prototype.possible = function(row, col, box) {
	var possible = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	var digits = this.rowdigits(row).concat(this.coldigits(col)).concat(this.boxdigits(box));
	digits.forEach(function (digit) {
		let index = possible.indexOf(digit);
		if (index != -1) possible.splice(possible.indexOf(digit), 1);
	});
	return possible;
}

// return an array of all values in the specified row
Sudoku.prototype.rowdigits = function(row) {
	return this.grid.slice(row*9, (row+1)*9).filter(function(value) { return value !== 0; });
}

// return an array of all values in the specified column
Sudoku.prototype.coldigits = function(col) {
	var result = [];
	for (var i = col; i < 81; i += 9) {
		let v = this.grid[i];
		if (v !== 0) result.push(v);
	}
	return result;
}

// return an array of all values in the specified box
Sudoku.prototype.boxdigits = function(b) {
	var i = [0, 3, 6, 27, 30, 33, 54, 57, 60][b];
	return [
		this.grid[i],    this.grid[i+1],  this.grid[i+2],
		this.grid[i+9],  this.grid[i+10], this.grid[i+11],
		this.grid[i+18], this.grid[i+19], this.grid[i+20]
	].filter(function(value) { return value !== 0; });
}

function Sudoku_scan(puzzle) {
	var unchanged = false, rmin, cmin, pmin;

	while (!unchanged) {
		unchanged = true;
		rmin = null, cmin = null, pmin = null;
		let iterator = puzzle.eachUnknown();
		let min = 10, iteration;

		while (!(iteration = iterator.next()).done) {
			let p = puzzle.possible(iteration.value.row, iteration.value.col, iteration.value.box);

			switch (p.length) {
				case 0:
					throw "Impossible";
					break;
				case 1:
					puzzle.set(iteration.value.row, iteration.value.col, p[0]);
					unchanged = false;
					break;
				default:
					if (unchanged && p.length < min) {
						min = p.length;
						rmin = iteration.value.row;
						cmin = iteration.value.col;
						pmin = p;
					}
			}
		}
	}

	return {"rmin": rmin, "cmin": cmin, "pmin": pmin};
}

function Sudoku_solve(puzzle) {
	var scanned = Sudoku_scan(puzzle);

	if (scanned.rmin == null) return puzzle;

	var i = scanned.pmin.length;
	while (i--) {
		let guess = scanned.pmin[i];
		puzzle.set(scanned.rmin, scanned.cmin, guess);

		try {
			return Sudoku_solve(puzzle);
		} catch (e) {
			continue;
		}
	}
}

//
document.getElementById("btn-solve").addEventListener('click', function(e) {
	this.disabled = true;
	var cells = document.querySelectorAll("table input");
	var sudoku = new Sudoku(cells);
	Sudoku_solve(sudoku);
});
