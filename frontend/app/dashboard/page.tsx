import React from 'react';

// Mock historical Team USA data for the "120 Years of Team USA" dashboard
const teamUsaGames = [
  {
    idEvent: '1',
    strEvent: 'USA vs USSR',
    strSport: 'Ice Hockey',
    strLeague: 'Winter Olympics',
    strSeason: '1980',
    dateEvent: '1980-02-22',
    strHomeTeam: 'Team USA',
    intHomeScore: '4',
    strAwayTeam: 'USSR',
    intAwayScore: '3',
    strVenue: 'Olympic Fieldhouse, Lake Placid',
    strVideo: 'https://www.youtube.com/watch?v=qYscemhnf88',
    description: 'The "Miracle on Ice" - USA collegiate players defeat the heavily favored Soviet professionals.',
  },
  {
    idEvent: '2',
    strEvent: 'USA vs Croatia',
    strSport: 'Basketball',
    strLeague: 'Summer Olympics',
    strSeason: '1992',
    dateEvent: '1992-08-08',
    strHomeTeam: 'Team USA',
    intHomeScore: '117',
    strAwayTeam: 'Croatia',
    intAwayScore: '85',
    strVenue: 'Palau dels Esports, Barcelona',
    strVideo: 'https://www.youtube.com/watch?v=kYv9d79QzYg',
    description: 'The "Dream Team" secures the gold medal in a dominating fashion.',
  },
  {
    idEvent: '3',
    strEvent: 'USA vs China',
    strSport: 'Women\'s Soccer',
    strLeague: 'FIFA Women\'s World Cup',
    strSeason: '1999',
    dateEvent: '1999-07-10',
    strHomeTeam: 'Team USA',
    intHomeScore: '0 (5)',
    strAwayTeam: 'China',
    intAwayScore: '0 (4)',
    strVenue: 'Rose Bowl, Pasadena',
    strVideo: 'https://www.youtube.com/watch?v=E1H9tqjL0yI',
    description: 'Brandi Chastain\'s winning penalty kick secures the World Cup for Team USA.',
  },
  {
    idEvent: '4',
    strEvent: 'USA vs France',
    strSport: 'Swimming',
    strLeague: 'Summer Olympics',
    strSeason: '2008',
    dateEvent: '2008-08-11',
    strHomeTeam: 'Team USA',
    intHomeScore: '1st',
    strAwayTeam: 'France',
    intAwayScore: '2nd',
    strVenue: 'Beijing National Aquatics Center',
    strVideo: 'https://www.youtube.com/watch?v=sxy920Nd7yY',
    description: 'Men\'s 4x100m Freestyle Relay - Jason Lezak\'s miraculous anchor leg.',
  },
  {
    idEvent: '5',
    strEvent: 'USA vs Russia',
    strSport: 'Women\'s Gymnastics',
    strLeague: 'Summer Olympics',
    strSeason: '1996',
    dateEvent: '1996-07-23',
    strHomeTeam: 'Team USA',
    intHomeScore: 'Gold',
    strAwayTeam: 'Russia',
    intAwayScore: 'Silver',
    strVenue: 'Georgia Dome, Atlanta',
    strVideo: 'https://www.youtube.com/watch?v=x0xWpIihkAE',
    description: 'The "Magnificent Seven" win the first-ever team gold for US women.',
  }
];

export default async function DashboardPage() {
  const games = teamUsaGames;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Team USA Historical Dashboard</h1>
        <p className="text-slate-600 mb-8">
          Showing legendary moments from 120 Years of Team USA. 
          Discover the archetypes of greatness!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div key={game.idEvent} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="bg-red-800 text-white p-4 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-200">
                  {game.strSport} • {game.strSeason}
                </span>
                <div className="mt-2 font-medium text-lg">
                  {game.strLeague}
                </div>
                <div className="mt-1 text-sm text-red-100">
                  {game.dateEvent}
                </div>
              </div>
              
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center w-2/5">
                    <p className="font-semibold text-slate-900">{game.strHomeTeam}</p>
                    <p className="text-xl font-bold text-blue-800 mt-1">{game.intHomeScore}</p>
                  </div>
                  <div className="text-slate-400 font-bold text-sm w-1/5 text-center">VS</div>
                  <div className="text-center w-2/5">
                    <p className="font-semibold text-slate-900">{game.strAwayTeam}</p>
                    <p className="text-xl font-bold text-slate-600 mt-1">{game.intAwayScore}</p>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 italic mb-4 flex-grow text-center">&quot;{game.description}&quot;</p>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 max-w-[60%] truncate" title={game.strVenue}>{game.strVenue}</span>
                  <a 
                    href={game.strVideo || '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-red-700 hover:text-red-900 font-medium"
                  >
                    Watch
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}