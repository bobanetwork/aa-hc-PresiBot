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
  return (
    <Card className='w-6/12 m-auto'>
      <CardHeader className="">
        <CardTitle className="w-2/12 mx-auto text-6xl hover:italic">?</CardTitle>
        <CardDescription className="text-lg italic">You're the US President</CardDescription>
        <CardDescription className="text-xs italic">Step into the shoes of the President of the United States and navigate through the complex and exciting world of leadership. Make critical decisions, tackle national and international challenges, and see how your choices shape the future of the nation. Are you ready to lead?</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col w-6/12 gap-2 mx-auto">
        <Button onClick={toQuestion} className="w-full ">Todays Question</Button>
        <Button onClick={toReward} className="w-full ">My Rewards</Button>
        <Button onClick={toInvite} className="w-full ">Invite Friend</Button>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-center mx-auto italic">This game is a simulation designed for educational and entertainment purposes. The scenarios presented are fictional and may not reflect real-world events or situations.</p>
      </CardFooter>
    </Card>
  );
}

export default EntryComponent;
