// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./HybridAccount.sol";

/**
 * @title PresiSimToken
 * @dev ERC20 token with game logic for rewards.
 */
contract PresiSimToken is ERC20, Ownable(msg.sender) {
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
        address winner;
    }

    Game[] public games;
    HybridAccount public HA;

    uint256 public currentGameID = 0;
    string public currentQuestion;
    mapping (uint256 => mapping(address => string)) public answers;
    mapping(uint256 => mapping(address => bool)) public hasPlayed;
    mapping(address => uint256) public consecutiveGamesPlayed;
    mapping(address => uint256) public rewards;

    event DailyQuestionUpdated(string question);
    event GameResultsSubmitted(uint256 gameID, address winner);
    event PlayerSubmittedAnswer(uint256 indexed gameID, address player, string answer);
    event RewardClaimed(address user, uint256 amount);
    event HCError(uint32 err);

    constructor(address _demoAddr) ERC20("PresiSim Token", "PST") {
        address payable demoAddr = payable(_demoAddr);
        HA = HybridAccount(demoAddr);
    }
    /**
     * @notice Fetches the daily question from the backend
     */
    function getDailyQuestion() external /** onlyOwner */ {
        string memory question;
        bytes memory req = abi.encodeWithSignature("createQuestion()");
        bytes32 userKey = bytes32(abi.encode(msg.sender));
        (uint32 err, bytes memory ret) = HA.CallOffchain(userKey, req);

        if (err == 0) {
            question = abi.decode(ret,(string));
        } else {
            emit HCError(err);
            revert("Error fetching question");
        }

        Game storage newGame = games.push();
        newGame.question = question;
        newGame.timeOfFetch = block.timestamp;

        currentGameID = games.length - 1;
        currentQuestion = question;

        emit DailyQuestionUpdated(question);
    }

    /**
     * @notice Submits the game results to the backend
     */
    function submitResults() external /** onlyOwner */ {
        address winner;
        bytes memory req = abi.encodeWithSignature("selectBestAnswer()");
        bytes32 userKey = bytes32(abi.encode(msg.sender));
        (uint32 err, bytes memory ret) = HA.CallOffchain(userKey, req);

        if (err == 0) {
            winner = abi.decode(ret,(address));
            _mint(winner, dailyReward);
            games[currentGameID].winner = winner;
        } else {
            emit HCError(err);
            revert("Error submitting results");
        }

        emit GameResultsSubmitted(currentGameID,winner);
    }

    /**
     * @notice Allows a player to submit their answer and handle referrals
     * @param answer Player's answer
     */
    function submitByPlayer(string calldata answer) external {
        require(!hasPlayed[currentGameID][msg.sender], "You have already played today");

        hasPlayed[currentGameID][msg.sender] = true;
        answers[currentGameID][msg.sender] = answer;

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

    function getCurrentQuesiton() external view returns(string memory)
    {
        return games[currentGameID].question;
    }

    function getWinnerByGameID(uint gameID) external view returns(address)
    {
        return games[gameID].winner;
    }
}