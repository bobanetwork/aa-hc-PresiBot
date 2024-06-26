// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PresiSimToken
 * @dev ERC20 token with game logic for rewards.
 */
contract PresiSimToken is ERC20, Ownable {
    uint256 public dailyReward = 100 * (10 ** 18); // Daily reward, adjustable
    uint256 public referralReward = 10 * (10 ** 18); // Referral reward, adjustable
    uint256 public consecutiveReward = 5 * (10 ** 18); // 7 Days consecutive reward, adjustable

    struct GameAnswer {
        address user;
        string answer;
    }

    struct Game {
        string question;
        uint timeOfFetch;
        GameAnswer[] answers;
    }

    Game[] public games;

    mapping(uint256 => mapping(address => bool)) public hasPlayed;
    mapping(address => uint256) public consecutiveGamesPlayed;
    mapping(address => uint256) public rewards;

    event DailyQuestionUpdated(string question);
    event GameResultsSubmitted(uint256 gameID, string results);
    event PlayerSubmittedAnswer(uint256 indexed gameID, address player, string answer);
    event RewardClaimed(address user, uint256 amount);

    constructor() ERC20("PresiSim Token", "PST") Ownable(msg.sender) {}

    /**
     * @notice Fetches the daily question from the backend
     */
    function getDailyQuestion() external onlyOwner {
        string memory question = "What is the capital of France?"; // Example question
        Game storage newGame = games.push();
        newGame.question = question;
        newGame.timeOfFetch = block.timestamp;
        emit DailyQuestionUpdated(question);
    }

    /**
     * @notice Submits the game results to the backend
     */
    function submitResults() external onlyOwner {
        uint256 currentGameID = games.length - 1;
        emit GameResultsSubmitted(currentGameID, "Results submitted to on-chain component");
    }

    /**
     * @notice Allows a player to submit their answer and handle referrals
     * @param answer Player's answer
     */
    function submitByPlayer(string calldata answer) external {
        uint256 currentGameID = games.length - 1;
        require(!hasPlayed[currentGameID][msg.sender], "You have already played today");

        hasPlayed[currentGameID][msg.sender] = true;
        games[currentGameID].answers.push(GameAnswer({user: msg.sender, answer: answer}));

        if (currentGameID == 0 || hasPlayed[currentGameID - 1][msg.sender]) {
            consecutiveGamesPlayed[msg.sender]++;
            if (consecutiveGamesPlayed[msg.sender] >= 7) {
                rewards[msg.sender] += consecutiveReward;
                consecutiveGamesPlayed[msg.sender] = 0;
            }
        } else {
            consecutiveGamesPlayed[msg.sender] = 0;
        }

        emit PlayerSubmittedAnswer(currentGameID, msg.sender, answer);
    }

    /**
     * @notice Allows a player to claim their accumulated rewards
     */
    function claimReward() external {
        uint256 rewardAmount = rewards[msg.sender];
        require(rewardAmount > 0, "No rewards available");

        rewards[msg.sender] = 0;
        _mint(msg.sender, rewardAmount);

        emit RewardClaimed(msg.sender, rewardAmount);
    }

    /**
     * @notice Sets a new daily reward
     * @param _newDailyReward New daily reward amount
     */
    function setDailyReward(uint256 _newDailyReward) external onlyOwner {
        dailyReward = _newDailyReward;
    }

    /**
     * @notice Sets a new referral reward
     * @param _newReferralReward New referral reward amount
     */
    function setReferralReward(uint256 _newReferralReward) external onlyOwner {
        referralReward = _newReferralReward;
    }

    /**
     * @notice Sets a new consecutive games reward
     * @param _newConsecutiveReward New consecutive games reward amount
     */
    function setConsecutiveReward(uint256 _newConsecutiveReward) external onlyOwner {
        consecutiveReward = _newConsecutiveReward;
    }
}