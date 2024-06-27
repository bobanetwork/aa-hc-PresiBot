import { defaultSnapOrigin, PRESI_SIM_TOKEN_CONTRACT } from '@/config/snap';
import { MetaMaskContext } from '@/hooks/MetamaskContext';
import { fetchDailyReward, fetchQuestionAnswer, fetchTodaysQuestion, fetchTodaysQuestionPlayed, fetchWinner, listenToAnswerSelection } from '@/services';
import { AbiCoder, concat, formatEther, FunctionFragment, hexlify, ZeroAddress } from 'ethers';
import { useContext, useEffect, useState } from 'react';
import truncateEthAddress from 'truncate-eth-address';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { useToast } from './ui/use-toast';

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
  const [gameReward, setGameReward] = useState<string>('');
  const [winner, setWinner] = useState<string>('');

  const [state] = useContext(MetaMaskContext);

  const abiCoder = new AbiCoder();

  const { toast } = useToast()

  useEffect(() => {
    const referrer = getQuery(window.location.toString())
    if (referrer) {
      setReferralAddress(referrer as unknown as string)
    }

    const loadData = async () => {
      try {
        if (state.selectedAcount) {
          setLoading(true);

          const gamePlayed = await fetchTodaysQuestionPlayed(state.selectedAcount?.address)
          const dailyReward = await fetchDailyReward();
          const todaysQuestion = await fetchTodaysQuestion();
          const winnedBy = await fetchWinner()
          if (winnedBy && winnedBy !== ZeroAddress) {
            setWinner(winnedBy);
            const submittedAnswer = await fetchQuestionAnswer(winnedBy)
            setAnswer(submittedAnswer);
            setIsAnswered(true);
          } else if (gamePlayed) {
            const submittedAnswer = await fetchQuestionAnswer(state.selectedAcount?.address)
            setAnswer(submittedAnswer);
            setIsAnswered(gamePlayed);
          }

          setGameReward(formatEther(dailyReward).toString())
          setQuestion(todaysQuestion);
          if (winnedBy === ZeroAddress) {
            listenToAnswerSelection()
          }

          setLoading(false);
        }
      } catch (error) {
        console.log(`load todays question`, error);
      }
    }

    loadData()

  }, [state.selectedAcount])

  const onSubmitAnswer = async () => {
    try {
      console.log(`submit answer to snap`, answer, referralAddress);
      setLoading(true);

      if (!state.selectedAcount || Number(state.chain) !== 28882) {
        console.log(`account not connected`)
        return;
      }
      if (!answer) {
        console.log(`invalid answer`)
        return;
      }

      const funcSelector = FunctionFragment.getSelector("submitByPlayer", ["string"]);

      const encodedParams = abiCoder.encode(
        ['string'],
        [answer],
      );

      const txData = hexlify(concat([funcSelector, encodedParams]));

      const transactionDetails = {
        payload: {
          to: PRESI_SIM_TOKEN_CONTRACT,
          value: '0',
          data: txData,
        },
        account: state.selectedAcount.id,
        scope: `eip155:${state.chain}`,
      };

      const txResponse = await window.ethereum?.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: defaultSnapOrigin,
          request: {
            method: 'eth_sendUserOpBoba', // operation to send the data to bundler
            params: [transactionDetails],
            id: state.selectedAcount?.id,
          },
        },
      })
      console.log(`txResponse`, txResponse);
      toast({
        title: '✅ Submitted Successfully!',
        description: `Your answer has been submitted successfully. If you win today's game, your reward will be automatically credited.`
      })
      setLoading(false);
      setIsAnswered(true);
    } catch (error) {
      console.log(`submit answer failed`, error);
      toast({
        title: "Uh oh! Something went wrong.",
        description: "Please maitain enough Sepo ETH or something else wrong!",
      })
      setLoading(false);
    }
  }

  return (
    <Card className='w-6/12 m-auto'>
      <CardHeader className="">
        <CardTitle className="w-2/12 mx-auto text-6xl hover:italic">
          📝
        </CardTitle>

        {winner ?
          winner === state.selectedAcount?.address ?
            <p className="text-lg font-bold text-green-600">Congratulation you have won!</p>
            : <p className="text-lg font-bold text-green-600">Winner of the Todays question {truncateEthAddress(winner)}!</p>
          : <CardDescription className="text-sm italic">Test your Presidential skills and win <b>{gameReward} Tokens</b></CardDescription>
        }
      </CardHeader>
      <CardContent className="flex flex-col w-11/12 gap-2 mx-auto">
        <CardDescription className={`text-lg text-black ${winner && 'font-light text-teal-900 italic'}`}>{question}</CardDescription>
        <textarea
          disabled={isAnswered || loading}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder='Your views..'
          className={`w-full min-h-60 border rounded p-4 text-left ${winner && 'font-light text-teal-900 italic'}`} >
        </textarea>
        {loading && question && <p className="text-sm italic">Please wait loading...</p>}
      </CardContent>
      {isAnswered && !winner &&
        <CardFooter className="flex gap-2 justify-center w-11/12 mx-auto">
          <p className="text-md text-green-500">You have submitted answer for todays question!</p>
        </CardFooter>
      }
      <CardFooter className="flex flex-col gap-2 justify-end w-11/12 mx-auto">
        {winner && !loading &&
          <p className="text-sm">Please visit again for next question tomorrow!</p>}
        <div className="flex w-full gap-2 justify-center">
          <Button className="w-4/12"
            disabled={loading}
            variant="outline"
            onClick={onClose}>Back To Home</Button>
          {!isAnswered &&
          <Button className="w-4/12"
            disabled={loading}
            variant="destructive"
            onClick={onSubmitAnswer}>Submit Answer</Button>
          }
        </div>
      </CardFooter>
    </Card>
  );
}

export default TodayQuestion;
