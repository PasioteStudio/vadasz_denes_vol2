export default function LogDisplayer(){
    return <>
        <div className="fixed bottom-0 right-0 bg-gray-50/30 w-102 h-[60vh] translate-y-8/12 hover:translate-y-0 duration-120 flex flex-col items-start justify-start overflow-y-scroll overflow-x-hidden *:w-max">
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Neque, aut.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Neque, aut.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Neque, aut.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Neque, aut.</p>
        </div>
        <div className="bottom-22 left-1/2 -translate-x-1/2 fixed max-h-20 overflow-y-hidden">
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui, sapiente!</p>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui, sapiente!</p>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui, sapiente!</p>
            <div className="bg-linear-0 from-black from-20% to-transparent to-70% z-20 absolute top-0 left-0 w-full h-full"></div>
        </div>
    </>
}