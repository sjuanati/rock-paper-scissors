const { expectRevert, time } = require('@openzeppelin/test-helpers');
const RockPaperScissors = artifacts.require('RockPaperScissors.sol');

contract('RockPaperScissors', (accounts) => {
    let contract;
    const [player1, player2] = [accounts[1], accounts[2]];
    const [salt1, salt2] = [10, 20];
    const [rock, paper, scissors] = [1, 2, 3];
    beforeEach(async () => {
        contract = await RockPaperScissors.new();
    });

    it('Should NOT create game if not ether sent', async () => {
        await expectRevert(
            contract.createGame(player2, { from: player1 }),
            'need to send some ether'
        );
    });

    it('Should create game', async () => {
        await contract.createGame(player2, { from: player1, value: 100 });
        const games = await contract.games(0);
        assert(games.id.toNumber() === 0);
        assert(games.bet.toNumber() === 100);
        assert(games.state.toNumber() === 0)
    });

      it('Should NOT join game if not second player', async () => {
        await contract.createGame(player2, { from: player1, value: 100 });
        await expectRevert(
            contract.joinGame(0, {from: player1, value: 200}),
            'sender must be second player'
        );
      });

      it('Should NOT join game if not enough ether sent', async () => {
        await contract.createGame(player2, { from: player1, value: 100 });
        await expectRevert(
            contract.joinGame(0, {from: player2, value: 50}),
            'not enough ether send'
        );
      });

      it('Should NOT join game if not in CREATED state', async () => {
        await contract.createGame(player2, { from: player1, value: 100 });
        await contract.joinGame(0, {from: player2, value: 100});
        await contract.commitMove(0, rock, salt1, {from: player1});
        await contract.commitMove(0, paper, salt2, {from: player2});
        await expectRevert(
            contract.joinGame(0, {from: player2, value: 200}),
            'must be in CREATED state'
        );
      });

      it('Should NOT commit move if game not in JOINED state', async () => {
        await contract.createGame(player2, { from: player1, value: 100 });
        await expectRevert(
            contract.commitMove(0, rock, salt1, {from: player1}),
            'game must be in JOINED state'
        );
      });

      it('Should NOT commit move if not called by player', async () => {
        await contract.createGame(player2, { from: player1, value: 100 });
        await contract.joinGame(0, {from: player2, value: 100});
        await expectRevert(
            contract.commitMove(0, rock, salt1, {from: accounts[4]}),
            'can only be called by 1 of the players'
        );
      });

      it('Should NOT commit move if move already made', async () => {
        await contract.createGame(player2, { from: player1, value: 100 });
        await contract.joinGame(0, {from: player2, value: 100});
        await contract.commitMove(0, rock, salt1, {from: player1});
        await expectRevert(
            contract.commitMove(0, paper, salt1, {from: player1}),
            'move already made'
        );
      });

      it('Should NOT commit move if non-existing move', async () => {
        await contract.createGame(player2, { from: player1, value: 100 });
        await contract.joinGame(0, {from: player2, value: 100});
        await expectRevert(
            contract.commitMove(0, 5, salt1, {from: player1}),
            'move must be either 1, 2 or 3'
        );
      });

      it('Should NOT reveal move if not in state COMMITED', async () => {
        await contract.createGame(player2, { from: player1, value: 100 });
        await contract.joinGame(0, {from: player2, value: 100});
        await contract.commitMove(0, rock, salt1, {from: player1});
        await expectRevert(
            contract.revealMove(0, rock, salt1, {from: player1}),
            'game must be in COMMITED state'
        );
      });

      it.only('Should NOT reveal move if moveId does not match commitment', async () => {
        await contract.createGame(player2, { from: player1, value: 100 });
        await contract.joinGame(0, {from: player2, value: 100});
        await contract.commitMove(0, rock, salt1, {from: player1});
        await contract.commitMove(0, scissors, salt2, {from: player2});
        // const move_player1 = await contract.moves(0, player1);
        // const move_player2 = await contract.moves(0, player2);
        // console.log('move player1:', move_player1.value.toNumber());
        // console.log('move player2:', move_player2.value.toNumber());
        // console.log('hash player1:', move_player1.hash);
        // console.log('hash player2:', move_player2.hash);
        // const game_state = await contract.games(0);
        // console.log('game state:', game_state.state.toNumber());
        await expectRevert(
            contract.revealMove(0, paper, salt1, {from: player1}),
            'moveId does not match commitment'
        );
        await expectRevert(
            contract.revealMove(0, rock, salt2, {from: player1}),
            'moveId does not match commitment'
        );
      });

    //   it('Full game', async () => {
    //   });

});