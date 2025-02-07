# Game Editor

## Javascript Chess Game Editor

### Components

#### Data structures

##### Coordinate

A coordinate on the game board, starting from the top-left corner.
    
    {x: 0..7, y: 0..7}
    
    # Examples
    {x: 0, y: 0} # a8
    {x: 7, y: 0} # h8
    {x: 7, y: 7} # h1
    {x: 0, y: 7} # a1

#### Modules

##### GameEditor

Container module to hold all the other classes, and utility functions

#### Models

##### Game

Manages a game with a series of connected boards and moves, and optional
variations

##### Board

A single board position, with a 2 dimensional array containing a piece, or
null, for every square on the board. Board state can be represented entirely
using FEN

##### Piece

A single piece, including type and color. Can enumerate valid moves for piece
when given a Board and coordinate.

*Important: Pieces are considered immutable.*

##### Move

A game move, including starting board position, from coordinate, to coordinate,
pawn promotion status, enpassant capture, etc...

#### Views

##### GameView

Base class, defines game editor with game board, navigations buttons, move 
history, editing buttons.

##### BoardView

Visual representation of a board, allows touch and mouse user interaction to
record moves.

##### MoveView
Displays a single move of the game - manages a list item in the move list, and
allows the user to click to go to the associated game state

##### PieceView

Displays a chess piece on the board. Capable of animating piece movement and
capture.