import { MetaMaskContext } from '@/hooks/MetamaskContext';
import { fetchReferralReward } from '@/services';
import { formatEther } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';

const InviteFriend = ({
  onClose
}: {
  onClose?: () => void
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [reward, setReward] = useState<string>('0');
  const [state] = useContext(MetaMaskContext);

  useEffect(() => {

    const loadData = async () => {
      try {
        const referralReward = await fetchReferralReward();
        setReward(formatEther(referralReward.toString()));
      } catch (error) {
        console.log(`load referral reward`, error);
      }
    }
    loadData()
  }, [])

  const copyInvite = async () => {
    setIsCopied(false);
    await navigator.clipboard.writeText(`${window.location}?start=${state.selectedAcount?.address}`)
    setIsCopied(true);
  }

  return (
    <Card className='w-6/12 m-auto'>
      <CardHeader className="">
        <CardTitle className="w-2/12 mx-auto text-6xl hover:italic">
          🚀
        </CardTitle>
        <CardTitle className="mx-auto text-2xl hover:italic">Invite Your Friends</CardTitle>
        <CardDescription className="text-sm">
          For every friend you invite who joins the game, you'll earn <span className="text-lg bold text-blue-500">{reward} tokens</span>! Use these tokens to unlock special features, rewards, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 mx-auto items-center justify-center">
        <CardDescription className="text-sm italic">Share this link with your friends to invite them to join the challenge. Click the button below to copy the invite URL to your clipboard.</CardDescription>
        <div className="flex flex-col items-center mx-auto w-full gap-2">
          <Button onClick={copyInvite} className="w-6/12" variant="destructive">Copy Invite Link</Button>
          {isCopied && <p className="text-xs text-center mx-auto italic">Invite link copied to clipboard!</p>}
          <Button onClick={onClose} variant="outline" className="w-6/12">Back to Home</Button>
        </div>
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  );
}

export default InviteFriend;
