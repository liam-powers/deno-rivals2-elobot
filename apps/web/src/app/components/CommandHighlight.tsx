export default function CommandHighlight({ text }: { text: string }) {
    return (
        <span className="font-bold bg-yellow-200 text-black">&nbsp;{text}&nbsp;</span>
    )
}