import { PRESI_SIM_TOKEN_CONTRACT } from '@/config/snap';
import { BrowserProvider, Contract } from 'ethers';
import { useEffect, useState } from 'react';
import PresiSimTokenAbi from '../../../contract/deployments/boba-sepolia/PresiSimToken.json';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';

function getQuery(url: string, q: string = 'start') {
  return (url.match(new RegExp('[?&]' + q + '=([^&]+)')) || [, null])[1];
}

const TodayQuestion = ({
  onClose
}: {
  onClose?: () => void
}) => {

  const [answer, setAnswer] = useState<string>('')
  // @ts-ignore
  const [isAnswered, setIsAnswered] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [referralAddress, setReferralAddress] = useState<string>('0x')

  // @ts-ignore
  const [question, setQuestion] = useState<string>('');

  useEffect(() => {
    const referrer = getQuery(window.location.toString())
    if (referrer) {
      setReferralAddress(referrer as unknown as string)
    }

    const loadQuestion = async () => {
      const provider = new BrowserProvider(window.ethereum, 'any')

      const tokenContract = new Contract(
        PRESI_SIM_TOKEN_CONTRACT,
        PresiSimTokenAbi.abi,
        provider
      )

      console.log(`calling tokenContract`, tokenContract);
      const question = await tokenContract.currentQuestion();
      console.log(`question`, question, question.toString());
    }
    loadQuestion()
  }, [])

  const onSubmitAnswer = () => {
    console.log(`submit answer to snap`, answer, referralAddress);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }

  return (
    <Card className='w-6/12 m-auto'>
      <CardHeader className="">
        <CardTitle className="w-2/12 mx-auto text-6xl hover:italic">?</CardTitle>
        <CardDescription className="text-sm italic">Test your Presidential skills?</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col w-11/12 gap-2 mx-auto">
        <CardDescription className="text-lg font-bold text-black italic">What is your approach to reforming healthcare in the US?        </CardDescription>
        <textarea
          disabled={isAnswered || loading}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder='Your views..'
          className="w-full min-h-60 border rounded p-4 text-left" >
        </textarea>
        {loading && <p className="text-sm italic">Submitting answer...</p>}
      </CardContent>
      {isAnswered &&
        <CardFooter className="flex gap-2 justify-center w-11/12 mx-auto">
          <p className="text-md text-green-500">You have submitted answer for todays question!</p>
        </CardFooter>
      }
      {!isAnswered &&
        <CardFooter className="flex gap-2 justify-end w-11/12 mx-auto">
          <Button className="w-4/12"
            disabled={loading}
            variant="outline"
            onClick={onClose}>Cancel</Button>
          <Button className="w-4/12"
            disabled={loading}
            onClick={onSubmitAnswer}>Submit Answer</Button>
        </CardFooter>}
    </Card>
  );
}

export default TodayQuestion;
