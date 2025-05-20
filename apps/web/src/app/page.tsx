import CommandHighlight from "./components/CommandHighlight";

export default function Home() {
    return (
        <div className="p-16 flex flex-col gap-8 text-xl items-center font-sans">
            <div className="text-center">
                <div className="text-3xl font-bold">Rivals 2 Elo Bot</div>
                <div className="text-lg text-gray-600">By @liamhi on Discord</div>
            </div>
            <div className="max-w-2xl mb-8">
                <div className="font-bold text-2xl">Overview</div>
                <div className="mb-4">The bot is currently in early access. If you would like to add the bot to your server, send a friend request to @liamhi on Discord and we can chat.</div>
                <div>This bot will track your Rivals 2 Ranked ELO via the Steam Leaderboard and <span className="font-bold">updates every 5 minutes</span> or whenever a new user registers their steam with the bot. With this data, it will:
                    <ul className="list-disc list-inside pl-8 mt-2">
                        <li>Append your ELO and global rank as <span className="font-bold">(ELO|#rank)</span> to the end of your nickname (if it has permission!)</li>
                        <li>Make your data available to the <CommandHighlight text="/leaderboard" /> command</li>
                    </ul>
                </div>
            </div>
            <div className="max-w-2xl mb-8">
                <div className="font-bold text-2xl">Getting Started</div>
                <div className="mb-4">To register yourself for the bot, type <CommandHighlight text="/link_steam" />. If everything goes according to plan, your nickname will update, and your information will appear on the leaderboard.</div>
                <div className="mb-4">To see the leaderboard, simply type <CommandHighlight text="/leaderboard" /> to get the steam profile pictures, Discord nicknames, server ranks, and ELO&apos;s of all registered players in the server.</div>
                <div className="mb-4">The bot does NOT catch onto your own nickname updates yet! If you&apos;d like to update your nickname, type <CommandHighlight text="/update_nick" /></div>
                <div>Finally, if you want to remove yourself from the service, enter <CommandHighlight text="/remove_steam" /> to stop the bot from tracking you.</div>
            </div>
            <div className="max-w-2xl">
                <div className="font-bold text-2xl">For Admins</div>
                <div className="mb-4">For people with ban permissions, you&apos;re able to easily manage other people&apos;s Steam links and nicknames with _other versions of the commands.</div>
                <div className="mb-4">For example, you can type <CommandHighlight text="/link_steam_other" /> to add or modify a Steam link.</div>
                <div>This is especially handy if people are linking steams that do not belong to them.</div>
            </div>
        </div >
    );
}
