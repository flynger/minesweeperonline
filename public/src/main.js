var minesweeper;

// custom names for keycodes
const KEYCODE = {
    LEFT_CLICK: 1, // LMB
    RIGHT_CLICK: 3, // RMB
    ENTER: 13, // ENTER
    SPACE: 32, // SPACE
    BACKTICK: 96 // `
};

// code run on startup
function setup() {
    minesweeper = new Minesweeper();
    minesweeper.startGame();
    setupChat();

    // set difficulty setting mins and maxes
    $("#custom_height").attr({
        "min": minesweeper.MIN.height,
        "max": minesweeper.MAX.height
    });
    $("#custom_width").attr({
        "min": minesweeper.MIN.width,
        "max": minesweeper.MAX.width
    });
    // setup events
    $("input[name='difficulty']").on("click", e => {
        e.target.blur();
    });
    $(".difficulty-select").on("change", () => {
        // limit height and width
        limitInput($("#custom_height"), minesweeper.MIN.height, minesweeper.MAX.height)
        limitInput($("#custom_width"), minesweeper.MIN.width, minesweeper.MAX.width)

        // limit mines
        let maxMines = +$("#custom_height").val() * +$("#custom_width").val() - 1;
        limitInput($("#custom_mines"), minesweeper.MIN.mines, maxMines)

        // update mins and maxes of element
        $("#custom_mines").attr({
            "min": minesweeper.MIN.mines,
            "max": maxMines
        });

        minesweeper.updateCustomSettings();
    });
    $(".difficulty-select").on("mousedown", () => {
        $('#custom').prop('checked', true);
    });
    $("#startGame").on("click", e => {
        e.target.blur();
        minesweeper.startGame();
    });
}

// minesweeper class
class Minesweeper {
    constructor() {
        this.TILE_SIZE = 32,
            this.BORDER = 20,
            this.BEGINNER = { height: 9, width: 9, mines: 10 },
            this.INTERMEDIATE = { height: 16, width: 16, mines: 40 },
            this.EXPERT = { height: 16, width: 30, mines: 99 },
            this.CUSTOM = { height: 20, width: 30, mines: 145 },
            this.MIN = { height: 1, width: 8, mines: 1 },
            this.MAX = { height: 36, width: 36 },
            this.GRID = []
    }
    startGame() {
        // update custom settings before creating board
        this.updateCustomSettings();
        this.SETTINGS = this[$("input[name='difficulty']:checked").val()];
        this.TOTALCELLS = (this.SETTINGS.width * this.SETTINGS.height) - this.SETTINGS.mines;
        this.OPENCELLS = 0;
        this.FLAGS = this.SETTINGS.mines;
        this.hoverCell, this.hoverX, this.hoverY = null;

        // reset board and input events
        this.GRID = [];
        this.resetBoard();
        this.updateFlagCounter();
        this.createMouseEvents();
        this.createKeyboardEvents();
    }
    resetBoard() {
        $("#game").html("");
        $("#game").width(this.SETTINGS.width * this.TILE_SIZE + this.BORDER * 2);
        $("#game").height(this.SETTINGS.height * this.TILE_SIZE + this.BORDER * 2);

        let grid = "";
        // game gui 
        grid += this.createImg("bordertl");
        grid += this.createImg("border-h").repeat(this.SETTINGS.width);
        grid += this.createImg("bordertr");
        grid += "<br>";

        grid += this.createImg("border-vlong");
        grid += this.createImg("time0", "mines_hundreds");
        grid += this.createImg("time0", "mines_tens");
        grid += this.createImg("time0", "mines_ones");

        let margin = 364 - (this.TILE_SIZE / 2) * (30 - this.SETTINGS.width);
        grid += this.createImg("facesmile", "face", "margin-left:" + margin + "px; margin-right: " + margin + "px;");
        grid += this.createImg("time0", "seconds_hundreds");
        grid += this.createImg("time0", "seconds_tens");
        grid += this.createImg("time0", "seconds_ones");
        grid += this.createImg("border-vlong");
        grid += "<br>";

        // top border
        grid += this.createImg("borderjointl");
        grid += this.createImg("border-h").repeat(this.SETTINGS.width);
        grid += this.createImg("borderjointr");
        grid += "<br>";

        // cells
        for (let i = 0; i < this.SETTINGS.height; i++) {
            grid += this.createImg("border-v");
            for (let j = 0; j < this.SETTINGS.width; j++) {
                grid += this.createImg("cell blank", i + "_" + j);
            }
            grid += this.createImg("border-v");
            grid += "<br>";
        }

        // bottom border
        grid += this.createImg("borderbl");
        for (let j = 1; j <= this.SETTINGS.width; j++) {
            grid += this.createImg("border-h");
        }
        grid += this.createImg("borderbr");

        // set the grid as html
        $("#game").html(grid);
    }
    updateCustomSettings() {
        this.CUSTOM = { height: +$("#custom_height").val(), width: +$("#custom_width").val(), mines: +$("#custom_mines").val() };
    }
    createImg(type, id, style, other) {
        let idText = id ? "' id='" + id : "";
        let styleText = style ? "' style='" + style : "";
        let otherText = other ? "' " + other : "";
        return "<div class='" + type + idText + styleText + otherText + "'></div>";
    }
    createBoard(startX, startY, width, height, mines) {
        let grid = new Array(height).fill("");
        for (let row in grid) {
            grid[row] = new Array(width).fill("0");
        }

        for (let v = -1; v <= 1; v++) {
            for (let h = -1; h <= 1; h++) {
                if (grid[startY + v] && grid[startY + v][startX + h] && (width * height - mines >= 9 || (h == 0 && v == 0))) grid[startY + v][startX + h] = "SAFE";
            }
        }

        while (mines > 0) {
            let x = randomNumber(0, width - 1);
            let y = randomNumber(0, height - 1);
            if (grid[y][x] !== "X" && grid[y][x] !== "SAFE") {
                grid[y][x] = "X";
                mines--;
            }
        }

        for (let row in grid) {
            for (let col in grid[row]) {
                if (grid[row][col] !== "X") {
                    grid[row][col] = this.countMines(grid, +col, +row);
                }
            }
        }
        console.log(grid);
        return grid;
    }
    createMouseEvents() {
        $("#game").unbind("mousedown").on("mousedown", e => {
            e.preventDefault();
            let cell = $(e.target);
            if (cell.hasClass("cell")) {
                let [x, y] = this.getCellFromID(cell.attr("id"));
                switch (e.which) {
                    case KEYCODE.LEFT_CLICK:
                        if (cell.hasClass("blank")) {
                            this.selectCell(x, y);
                        } else if (this.cellIsClear(cell)) {
                            this.selectCells(x, y);
                        }
                        break;
                    case KEYCODE.RIGHT_CLICK:
                        this.flagAndClear(x, y, e.which == KEYCODE.LEFT_CLICK);
                        break;
                    default:
                    // do nothing
                }
            }
        });

        $("#game").unbind("mouseup").on("mouseup", e => {
            e.preventDefault();
            let cell = $(e.target);
            if (cell.hasClass("cell")) {
                let [x, y] = this.getCellFromID(cell.attr("id"));
                switch (e.which) {
                    case KEYCODE.LEFT_CLICK:
                        if (cell.hasClass("selected")) {
                            // if game doesn't exist, create one
                            if (this.GRID.length == 0) {
                                this.GRID = this.createBoard(x, y, this.SETTINGS.width, this.SETTINGS.height, this.SETTINGS.mines);
                            }
                            this.clearCell(x, y);
                        } else if (this.satisfyFlags(x, y)) {
                            this.clearCells(x, y, false);
                        }
                        else this.deselectCells(x, y);
                        break;
                    default:
                    // do nothing
                }
            }
        });

        $("#game").on("mouseover", e => {
            let cell = $(e.target);
            if (cell.hasClass("cell")) {
                this.hoverCell = cell;
                [this.hoverX, this.hoverY] = this.getCellFromID(this.hoverCell.attr("id"));
                e.preventDefault();
                switch (e.buttons) {
                    case 1:
                        if (cell.hasClass("blank")) {
                            this.selectCell(this.hoverX, this.hoverY);
                        } else if (this.cellIsClear(cell)) {
                            this.selectCells(this.hoverX, this.hoverY);
                        }
                        break;
                    case 3:
                        //selectCell(x, y);
                        break;
                    default:
                    // nothing
                }
            }
            else {
                this.hoverCell = null;
                this.hoverX, this.hoverY = null;
            }
        });

        $("#game").on("mouseout", e => {
            e.preventDefault();
            let cell = $(e.target);
            if (cell.hasClass("cell")) {
                let [x, y] = this.getCellFromID(cell.attr("id"));
                // console.log(cell);
                this.deselectCells(x, y);
            }
        });
    }
    createKeyboardEvents() {
        $(document).unbind("keypress").on("keypress", e => {
            // console.log(hoverCell)
            if (e.which === KEYCODE.SPACE && e.target == document.body) {
                // check SPACE
                e.preventDefault();
                if (this.hoverCell && this.hoverCell.hasClass("cell")) {
                    this.flagAndClear(this.hoverX, this.hoverY, true);
                }
            } else if (e.which === KEYCODE.BACKTICK && e.target == document.body) {
                // check BACKTICK
                e.preventDefault();
                this.startGame();
            }
        });
    }
    // count mines while generating
    countMines(grid, x, y) {
        let mines = 0;
        for (let v = -1; v <= 1; v++) {
            for (let h = -1; h <= 1; h++) {
                if (grid[y + v] && grid[y + v][x + h] != undefined && grid[y + v][x + h] === "X") mines++;
            }
        }
        return mines;
    }
    // count flags in order to clear area
    satisfyFlags(x, y) {
        let flags = 0;
        this.do3x3Operation(x, y, (thisX, thisY, thisCell) => {
            if (thisCell.hasClass("bombflagged")) flags++;
        });
        return this.cellIsClear(this.getCanvasCell(x, y)) && flags === this.GRID[y][x];
    }
    clearCell(x, y) {
        let cell = this.GRID[y][x];
        let classToAdd;
        // death check
        if (cell === "X") {
            for (let row in this.GRID) {
                for (let col in this.GRID[row]) {
                    let isFlagged = this.getCanvasCell(col, row).hasClass("bombflagged");
                    if (this.GRID[row][col] === "X") {
                        if (!isFlagged) {
                            this.getCanvasCell(col, row).attr("class", "bombrevealed");
                        }
                    }
                    else if (isFlagged) {
                        this.getCanvasCell(col, row).attr("class", "bombmisflagged");
                    }
                }
            }
            $("#game").off();
            classToAdd = "bombdeath";
        } else {
            classToAdd = "cell open" + cell;
            this.OPENCELLS++;
        }

        // if there was a flag update counter
        if (this.getCanvasCell(x, y).hasClass("bombflagged")) {
            this.FLAGS++;
            this.updateFlagCounter();
        }

        // open the cell
        this.getCanvasCell(x, y).attr("class", classToAdd);

        // checks if all possible cleared cells are cleared (win code)
        if (this.OPENCELLS === this.TOTALCELLS) {
            this.FLAGS = 0;
            this.updateFlagCounter();
            for (let row in this.GRID) {
                for (let col in this.GRID[row]) {
                    if (this.GRID[row][col] === "X") {
                        this.getCanvasCell(col, row).attr("class", "bombflagged");
                    }
                }
            }
        }

        // if a 0, open nearby cells
        if (cell === 0) {
            this.clearCells(x, y, true);
        }
    }
    clearCells(x, y, overrideFlags) {
        this.do3x3Operation(x, y, (thisX, thisY, thisCell) => {
            if (!this.cellIsClear(thisCell) && (thisCell.hasClass("blank") || thisCell.hasClass("selected") || overrideFlags)) this.clearCell(thisX, thisY);
        });
    }
    cellIsClear(cell) {
        return cell.attr("class").includes("open");
    }
    flagAndClear(x, y, clearCondition) {
        let cell = this.getCanvasCell(x, y);
        if (cell.hasClass("blank")) {
            // if cell blank, add flag
            this.FLAGS--;
            this.updateFlagCounter();
            cell.attr("class", "cell bombflagged");
        } else if (cell.hasClass("bombflagged")) {
            // if flag, revert to blank
            this.FLAGS++;
            this.updateFlagCounter();
            cell.attr("class", "cell blank");
        } else if (clearCondition && this.satisfyFlags(x, y)) {
            // if left click is on, clear cells
            this.clearCells(x, y, false);
        }
    }
    getCanvasCell(x, y) {
        return $(`#${y}_${x}`);
    }
    getCellFromID(id) {
        let [cellY, cellX] = id.split("_");
        // return x, y of cell
        return [+cellX, +cellY];
    }
    selectCell(x, y) {
        let cell = this.getCanvasCell(x, y);
        // if cell exists and is blank
        if (cell.length && cell.hasClass("blank")) {
            cell.attr("class", "cell selected");
        }
    }
    selectCells(x, y) {
        // if any of 3x3 is blank, select it
        this.do3x3Operation(x, y, (thisX, thisY, cell) => {
            this.selectCell(thisX, thisY);
        });
    }
    deselectCell(x, y) {
        let cell = this.getCanvasCell(x, y);
        // if cell exists and is selected
        if (cell.length && cell.hasClass("selected")) {
            cell.attr("class", "cell blank");
        }
    }
    deselectCells(x, y) {
        // if cell exists and is blank
        this.do3x3Operation(x, y, (thisX, thisY, cell) => {
            this.deselectCell(thisX, thisY);
        });
    }
    do3x3Operation(x, y, func) {
        for (let ny = y - 1; ny <= y + 1; ny++) {
            for (let nx = x - 1; nx <= x + 1; nx++) {
                let cell = this.getCanvasCell(nx, ny);
                if (cell.length) func(nx, ny, cell);
            }
        }
    }
    updateFlagCounter() {
        let flagString = "" + limitNumber(this.FLAGS, -99, 999);
        while (flagString.length < 3) {
            if (+flagString < 0) {
                flagString = "-0" + -+flagString;
                break;
            }
            flagString = "0" + flagString;
        }
        $("#mines_ones").attr("class", "time" + flagString[2]);
        $("#mines_tens").attr("class", "time" + flagString[1]);
        $("#mines_hundreds").attr("class", "time" + flagString[0]);
    }
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function limitNumber(val, min, max) {
    if (val < min) return min;
    else if (val > max) return max;
    else return val;
}

function limitInput(input, min, max) {
    input.val(limitNumber(+input.val(), min, max));
}