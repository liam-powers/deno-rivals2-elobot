import CommandHighlight from "./components/CommandHighlight";

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-16 flex flex-col gap-8 text-xl items-center font-sans">
            <div className="text-center">
                <div className="text-3xl font-bold text-white">Rivals 2 Elo Bot</div>
                <div className="text-lg text-gray-400">By @liamhi on Discord</div>
            </div>
            <div className="max-w-2xl mb-8">
                <div className="font-bold text-2xl text-white">Overview</div>
                <div className="mb-4 text-gray-300">The bot is currently in early access. If you would like to add the bot to your server, send a friend request to @liamhi on Discord and we can chat.</div>
                <div className="text-gray-300">This bot will track your Rivals 2 Ranked ELO via the Steam Leaderboard and <span className="font-bold text-white">updates every 5 minutes</span>. With this data, it will:
                    <ul className="list-disc list-inside pl-8 mt-2 text-gray-300">
                        <li>Optionally append your ELO and global rank as <span className="font-bold text-white">(ELO|#rank)</span> to the end of your nickname</li>
                        <li>Make your data available to the <CommandHighlight text="/leaderboard" /> command</li>
                        <li>Allow you to manage your profile settings and Steam connection</li>
                    </ul>
                </div>
            </div>
            <div className="max-w-2xl mb-8">
                <div className="font-bold text-2xl text-white">Getting Started</div>
                <div className="mb-4 text-gray-300">The bot uses a comprehensive <CommandHighlight text="/profile" /> command with several subcommands to manage your settings:</div>
                <ul className="list-disc list-inside pl-8 mb-4 text-gray-300">
                    <li><CommandHighlight text="/profile status" /> - Check your current profile status</li>
                    <li><CommandHighlight text="/profile set_nickname" /> - Set your base nickname</li>
                    <li><CommandHighlight text="/profile toggle_elo" /> - Toggle whether your nickname should be updated with ELO</li>
                    <li><CommandHighlight text="/profile link_steam" /> - Link your Discord account to your Steam profile</li>
                    <li><CommandHighlight text="/profile unlink_steam" /> - Remove your Steam account linkage</li>
                </ul>
                <div className="mb-4 text-gray-300">To see the leaderboard, simply type <CommandHighlight text="/leaderboard" /> to get the steam profile pictures, Discord nicknames, server ranks, and ELO&apos;s of all registered players in the server.</div>
            </div>
            <div className="max-w-2xl">
                <div className="font-bold text-2xl text-white">For Admins</div>
                <div className="mb-4 text-gray-300">For people with ban permissions, you can manage other users&apos; profiles by adding a target user to any of the profile commands.</div>
                <div className="mb-4 text-gray-300">For example, you can type <CommandHighlight text="/profile link_steam" /> and specify a target user to add or modify their Steam link.</div>
                <div className="text-gray-300">This is especially handy if people are linking steams that do not belong to them.</div>
            </div>
        </div>
    );
}
