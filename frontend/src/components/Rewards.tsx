import { MetaMaskContext } from '@/hooks/MetamaskContext';
import { fetchBalance } from '@/services';
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

  const [balance, setBalance] = useState<string>('0.0');
  const [state] = useContext(MetaMaskContext);

  useEffect(() => {

    const loadData = async () => {
      try {
        if (state.selectedAcount?.address) {
          const tokenBalance = await fetchBalance(state.selectedAcount.address);
          setBalance(formatEther(tokenBalance.toString()));
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
          <CardDescription className="text-3xl bold italic">{balance}</CardDescription>
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
