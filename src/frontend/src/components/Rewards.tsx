import { MetaMaskContext } from '@/hooks/MetamaskContext';
import { fetchRewards } from '@/services';
import { formatEther } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import { Button } from './ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from './ui/card';

const UserRewards = ({
  onClose
}: {
  onClose?: () => void
}) => {

  const [reward, setReward] = useState<string>('0.0');
  const [state] = useContext(MetaMaskContext);

  useEffect(() => {

    const loadData = async () => {
      try {
        if (state.selectedAcount?.address) {
          const userReward = await fetchRewards(state.selectedAcount.address);
          setReward(formatEther(userReward.toString()));
        }
      } catch (error) {
        console.log(`load rewards`, error);
      }
    }
    loadData()
  }, [state.selectedAcount])


  return (
    <Card className='w-6/12 m-auto'>
      <CardHeader className="">
        <CardTitle className="w-2/12 mx-auto text-6xl hover:italic">
          💰
        </CardTitle>
        <Card className='w-6/12 m-auto'>
          <CardDescription className="text-3xl bold italic">{reward}</CardDescription>
          <CardDescription className="text-sm italic">PresiSimToken Balance</CardDescription>
        </Card>
      </CardHeader>
      <CardFooter>
        <Button className="w-4/12 mx-auto"
          variant="outline"
          onClick={onClose}>Back to Home</Button>
      </CardFooter>
    </Card>
  );
}

export default UserRewards;
