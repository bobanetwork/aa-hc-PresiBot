import { BrowserProvider, Contract } from "ethers";
import PresiSimTokenAbi from '../../../contract/deployments/boba-sepolia/PresiSimToken.json';
import { PRESI_SIM_TOKEN_CONTRACT } from "@/config/snap";

export const tokenContract = async () => {
  const provider = new BrowserProvider(window.ethereum, 'any')
  const contract = new Contract(
    PRESI_SIM_TOKEN_CONTRACT,
    PresiSimTokenAbi.abi,
    provider
  )
  return contract;
}
export const fetchDailyReward = async () => {
  const contract = await tokenContract();
  return await contract.dailyReward();
}
export const fetchReferralReward = async () => {
  const contract = await tokenContract();
  return await contract.referralReward()
}
export const fetchConsecutiveReward = async () => {
  const contract = await tokenContract();
  return await contract.consecutiveReward()
}
export const fetchTodaysQuestion = async () => {
  const contract = await tokenContract();
  return await contract.currentQuestion()
}
export const fetchTodaysGameId = async () => {
  const contract = await tokenContract();
  return await contract.currentGameID()
}
export const fetchTodaysQuestionPlayed = async () => {
  const contract = await tokenContract();
  const playMap = await contract.hasPlayed()
  console.log(`playMap`, playMap);
  return false;
}
export const fetchQuestionAnswer = async () => {
  const contract = await tokenContract();
  const answers = await contract.answers()
  console.log(`answers`, answers);
  return false;
}
export const fetchConsecutiveGamesPlayed = async () => {
  const contract = await tokenContract();
  return await contract.consecutiveGamesPlayed()
}

export const fetchRewards = async () => {
  const contract = await tokenContract();
  return await contract.rewards()
}
