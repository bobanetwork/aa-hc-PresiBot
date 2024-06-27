import { MetaMaskContext } from '@/hooks/MetamaskContext';
import { fetchDailyReward, fetchQuestionAnswer, fetchTodaysQuestion, fetchTodaysQuestionPlayed } from '@/services';
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

  const [state] = useContext(MetaMaskContext);

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
          if (gamePlayed) {
            const submittedAnswer = await fetchQuestionAnswer(state.selectedAcount?.address)
            console.log(`submittedAnswer`, submittedAnswer)
            setAnswer(submittedAnswer);
          }

          setIsAnswered(gamePlayed);
          setGameReward(formatEther(dailyReward).toString())
          setQuestion(todaysQuestion);

          setLoading(false);
        }
      } catch (error) {
        console.log(`load todays question`, error);
      }
    }

    loadData()

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
        <CardTitle className="w-2/12 mx-auto text-6xl hover:italic">
          📝
        </CardTitle>
        <CardDescription className="text-sm italic">Test your Presidential skills and win <b>{gameReward} Tokens</b></CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col w-11/12 gap-2 mx-auto">
        <CardDescription className="text-lg text-black">{question}</CardDescription>
        <textarea
          disabled={isAnswered || loading}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder='Your views..'
          className="w-full min-h-60 border rounded p-4 text-left" >
        </textarea>
        {loading && question && <p className="text-sm italic">Submitting answer...</p>}
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
            variant="destructive"
            onClick={onSubmitAnswer}>Submit Answer</Button>
        </CardFooter>}
    </Card>
  );
}

export default TodayQuestion;
