import { MetaMaskContext } from '@/hooks/MetamaskContext';
import { fetchConsecutiveGamesPlayed } from '@/services';
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

const EntryComponent = ({
  toQuestion,
  toInvite,
  toReward
}: {
  toQuestion: () => void,
  toInvite: () => void,
  toReward: () => void,
}) => {
  const [consecutive, setconsecutive] = useState<string>('0');

  const [state] = useContext(MetaMaskContext)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log(`fetching games`, state.selectedAcount)
        if (state.selectedAcount?.address) {
          console.log(`loading consecutive game played`);
          const gamesPlayed = await fetchConsecutiveGamesPlayed(state.selectedAcount.address);
          console.log(`number of games played`, gamesPlayed)
          setconsecutive(gamesPlayed.toString());
        }
      } catch (error) {
        console.log(`laoding consecutive plays`, error)
      }
    }
    loadData();
  }, [state.selectedAcount]);

  return (
    <Card className='w-6/12 m-auto'>
      <CardHeader className="">
        <CardTitle className="w-2/12 mx-auto text-8xl hover:italic">
          🗳
        </CardTitle>
        <CardDescription className="text-md italic">Step into the shoes of the President of the United States and navigate through the complex and exciting world of leadership. Make critical decisions, tackle national and international challenges, and see how your choices shape the future of the nation. Are you ready to lead?</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col w-8/12 gap-2 mx-auto">
        <Button onClick={toQuestion} className="w-full" variant="destructive">Todays Question</Button>
        <Button onClick={toReward} className="w-full" variant="destructive">My Rewards</Button>
        <Button onClick={toInvite} className="w-full" variant="destructive">Invite Friend</Button>
      </CardContent>
      <CardFooter className="flex flex-col">
        <CardDescription className="text-xl mb-2 text-black italic">You have played {consecutive} consecutive games till today!</CardDescription>
        <p className="text-xs text-teal-500 text-center mx-auto italic">NOTE: This game is a simulation designed for educational and entertainment purposes. The scenarios presented are fictional and may not reflect real-world events or situations.</p>
      </CardFooter>
    </Card>
  );
}

export default EntryComponent;
