import { useState } from "react";

function Pokedex() {

    const [pokemon, alteraPokemon] = useState(null)
    const [pesquisa, alteraPesquisa] = useState("")

    async function buscaPokemon(nome) {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon/"+nome)
        const data = await response.json()
        console.log(data)
        alteraPokemon(data)
    }

    return (
        <div>
            <h1>Pokédex</h1>
            <p>Consulte um Pokémon</p>

            <input onChange={ e => alteraPesquisa(e.target.value)} placeholder="Digite o Pokémon..." />
            <button onClick={()=>buscaPokemon(pesquisa)} >🔎 Pesquisar</button>

            <hr/>

            <h2>Nome: {pokemon?.name}</h2>
            <p>Tipo: {pokemon?.types.map(i => i.type?.name )} </p>
            <img src={pokemon?.sprites?.other?.showdown?.front_default} />

        </div>
    );
}

export default Pokedex;