import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

const rewards = Array.from({ length: 10 }).map(
  (_, i) => i % 2 == 0 ? `Referral Bonus - 50Token` : `Winning Answer - 100Token`
)

const UserRewards = ({
  onClose
}: {
  onClose?: () => void
}) => {

  return (
    <Card className='w-6/12 m-auto'>
      <CardHeader className="">
        <Card className='w-6/12 m-auto'>
          <CardDescription className="text-3xl bold italic">0.00</CardDescription>
          <CardDescription className="text-sm italic">PresiSimToken Balance</CardDescription>
        </Card>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 mx-auto items-center justify-center">
        <CardTitle className="mx-auto text-xl mb-2 hover:italic">Reward History</CardTitle>
        <ScrollArea className="h-72 w-10/12 rounded-md border">
          <div className="p-4">
            {rewards.map((tag, i) => (
              <div key={`${tag}-${i}`}>
                <div key={tag} className="text-sm">
                  {tag}
                </div>
                <Separator className="my-2" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button className="w-4/12 mx-auto"
          variant="outline"
          onClick={onClose}>Back to Home</Button>
      </CardFooter>
    </Card>
  );
}

export default UserRewards;
