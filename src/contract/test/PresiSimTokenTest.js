const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PresiSimToken", function () {
  let Token, token, owner, addr1, addr2;

  beforeEach(async function () {
    Token = await ethers.getContractFactory("PresiSimToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the token contract
    token = await Token.deploy();
  });

  describe("Token deployment", function () {
    it("Should have zero initial supply", async function () {
      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.equal(0);
    });
  });

  describe("Game Logic", function () {
    async function simulateNewDay() {
      await token.connect(owner).getDailyQuestion();
      await token.connect(owner).submitResults();
    }

    it("Should allow player to submit answer and handle referral", async function () {
      await simulateNewDay();
      await token.connect(addr1).submitByPlayer(addr2.address, "Answer");
      expect(await token.rewards(addr2.address)).to.equal(ethers.parseEther("10"));
    });

    it("Should allow claiming referral reward", async function () {
      await simulateNewDay();
      await token.connect(addr1).submitByPlayer(addr2.address, "Answer");
      await token.connect(addr2).claimReward();
      expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseEther("10"));
    });

    it("Should handle consecutive games played", async function () {
      for (let i = 0; i < 7; i++) {
        await simulateNewDay();
        await token.connect(addr1).submitByPlayer(ethers.ZeroAddress, "Answer");
      }
      await simulateNewDay();
      await token.connect(addr1).submitByPlayer(ethers.ZeroAddress, "Answer");
      await token.connect(addr1).claimReward();
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("5"));
    });

    it("Should reset consecutive games if not played consecutively", async function () {
      await simulateNewDay();
      await token.connect(addr1).submitByPlayer(ethers.ZeroAddress, "Answer");
      await simulateNewDay();
      await token.connect(addr2).submitByPlayer(ethers.ZeroAddress, "Answer");

      await network.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]); // Increase time by 2 days
      await simulateNewDay();
      await token.connect(addr1).submitByPlayer(ethers.ZeroAddress, "Answer");

      expect(await token.consecutiveGamesPlayed(addr1.address)).to.equal(0);
    });
  });
});
