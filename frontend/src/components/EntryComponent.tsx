// import { MetaMaskContext } from '@/hooks/MetamaskContext';
import {useContext, useState} from 'react';
import {Button} from './ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from './ui/card';
import logo from '@/assets/presibot colored title.svg'
import robo from '@/assets/president robot.png'
import poweredBy from '@/assets/powered by boba and HC.svg'
import {MetaMaskContext} from "@/hooks/MetamaskContext.tsx";


const EntryComponent = ({
                            toQuestion,
                            toInvite,
                            toReward
                        }: {
    toQuestion: () => void,
    toInvite: () => void,
    toReward: () => void,
}) => {
    const [consecutive] = useState<string>('0');
    const [state] = useContext(MetaMaskContext)

    // const [state] = useContext(MetaMaskContext)

    // useEffect(() => {
    //   const loadData = async () => {
    //     try {
    //       console.log(`selected ac`, state.selectedAcount)
    //       if (state.selectedAcount?.address) {
    //         console.log(`loading consecutive game played`);
    //         /** @DEV disabled for now */
    //         // const gamesPlayed = await fetchConsecutiveGamesPlayed(state.selectedAcount.address);
    //         // console.log(`number of games played`, gamesPlayed)
    //         // setconsecutive(gamesPlayed.toString());
    //       }
    //     } catch (error) {
    //       console.log(`laoding consecutive plays`, error)
    //     }
    //   }
    //   loadData();
    // }, [state.selectedAcount]);

    return (
        <div>

            <Card className='w-10/12 m-auto border-radius-10 overflow-hidden relative max-w-4xl'>
                <img className="robot-position" src={robo} alt=""/>
                <CardHeader className="z-10">
                    <CardTitle className="w-2/12ext-8xl ml-5 hover:italic mb-10 mt-5">
                        <img src={logo} alt="logo" className="w-72"/>
                    </CardTitle>
                    <CardDescription className="text-md ml-5 text-black text-left mt-28 w-6/12 justify-l">Step into the
                        shoes of the President of the United States and navigate through the complex and exciting world
                        of
                        leadership. Make critical decisions, tackle national and international challenges, and see how
                        your
                        choices shape the future of the nation.</CardDescription>
                    <CardDescription className="font-bold text-md ml-5 text-black text-left mt-10 w-4/12 justify-l"> Are
                        you ready to
                        lead?</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col w-8/12 ml-5 gap-2">
                    <Button onClick={toQuestion} className="w-52 font-bold" variant="default"
                            style={{"backgroundColor": "#F27556"}}>Today's Question</Button>
                    <Button onClick={toReward} className="w-52 font-bold" variant="default">My Rewards</Button>
                    <Button onClick={toInvite} className="w-52 font-bold" variant="default">Invite Friend</Button>
                </CardContent>
                <CardFooter className="ml-5 mt-5">
                    <CardDescription className="border p-2 text-sm rounded-2xl border-black mb-2 text-black">You
                        have played {consecutive} consecutive games till today!</CardDescription>
                </CardFooter>
            </Card>
            <div className="w-6/12 m-auto border-radius-10  overflow-hidden relative">
                <img className="m-auto w-80 mt-28" src={poweredBy} alt=""/>
                <span className="block mt-3 font-bold text-xs text-gray-600 sm:text-center dark:text-gray-400">
                    Snap Version: Latest Installed Snap: {state?.installedSnap?.version}
                </span>
            </div>
        </div>
    );
}

export default EntryComponent;
