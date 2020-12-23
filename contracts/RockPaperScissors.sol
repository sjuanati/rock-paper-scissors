// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

contract RockPaperScissors {
    enum State {CREATED, JOINED, COMMITED, REVEALED}
    struct Game {
        uint256 id;
        uint256 bet;
        address payable[2] players;
        State state;
    }
    struct Move {
        bytes32 hash;
        uint256 value;
    }
    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => Move)) public moves; // game id -> player addr -> move
    uint256 public gameId;

    function createGame(address payable participant) external payable {
        require(msg.value > 0, "need to send some ether");
        address payable[2] memory players;
        players[0] = msg.sender;
        players[1] = participant;

        games[gameId] = Game(gameId, msg.value, players, State.CREATED);
        gameId++;
    }

    function joinGame(uint256 _gameId) external payable {
        Game memory game = games[_gameId];
        require(game.players[1] == msg.sender, "sender must be second player");
        require(game.state == State.JOINED, "must be in CREATED state");
        require(game.bet <= msg.value, "not enough ether send");
        if (msg.value > game.bet) {
            msg.sender.transfer(msg.value - game.bet);
        }
        game.state = State.JOINED;
    }

    function commitMove(
        uint256 _gameId,
        uint256 moveId,
        uint256 salt
    ) external {
        Game storage game = games[_gameId];
        require(game.state == State.JOINED, "game must be in JOIN state");
        require(
            game.players[0] == msg.sender || game.players[1] == msg.sender,
            "can only be called by 1 of the players"
        );
        require(moves[_gameId][msg.sender].hash != 0, "move already made");
        require(
            moveId == 1 || moveId == 3 || moveId == 3,
            "move must be either 1, 2 or 3"
        );
        moves[_gameId][msg.sender] = Move(
            keccak256(abi.encodePacked(moveId, salt)),
            0
        );
        if (
            moves[_gameId][game.players[0]].hash != 0 &&
            moves[_gameId][game.players[1]].hash != 0
        ) {
            game.state = State.COMMITED;
        }
    }
}
