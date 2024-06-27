import { useContext, useState } from 'react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { MetaMaskContext } from '@/hooks/MetamaskContext';

const InviteFriend = ({
  onClose
}: {
  onClose?: () => void
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [state] = useContext(MetaMaskContext);

  const copyInvite = async () => {
    setIsCopied(false);
    console.log(window.location);
    console.log(`current user address`, state.selectedAcount?.address)
    await navigator.clipboard.writeText(`${window.location}?start=${state.selectedAcount?.address}`)
    setIsCopied(true);
  }

  return (
    <Card className='w-6/12 m-auto'>
      <CardHeader className="">
        <CardTitle className="mx-auto text-2xl hover:italic">Invite Your Friends        </CardTitle>
        <CardDescription className="text-sm">
          For every friend you invite who joins the game, you'll earn 100 tokens! Use these tokens to unlock special features, rewards, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 mx-auto items-center justify-center">
        <CardDescription className="text-sm italic">Share this link with your friends to invite them to join the challenge. Click the button below to copy the invite URL to your clipboard.</CardDescription>
        <div className="flex flex-col items-center mx-auto w-full gap-2">
          <Button onClick={copyInvite} className="w-6/12">Copy Invite Link</Button>
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
