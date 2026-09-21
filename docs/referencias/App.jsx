import { useEffect, useState } from "react";
import { supabase } from "./supabase";

function App() {

    const [produtos, alteraProdutos] = useState([])

    const [nome, alteraNome] = useState("")
    const [preco, alteraPreco] = useState("")
    const [tamanho, alteraTamanho] = useState("")
    const [descricao, alteraDescricao] = useState("")

    async function inserir(){
        const obj = {
            nome: nome,
            preco: preco,
            tamanho: tamanho,
            descricao: descricao
        }
        const { data, error } = await supabase.from('produtos').insert(obj)
        alert("Produto cadastrado com sucesso!")
        document.location.reload()
    }

    async function buscaTodos(){
        const { data, error } = await supabase.from('produtos').select().order('id', { ascending: false })
        console.log(data)
        alteraProdutos(data)
    }

    useEffect( ()=>{
        buscaTodos()
    }, [] )

    return (
        <div>
            <h1>Conexão com Supabase</h1>

            <input onChange={e => alteraNome(e.target.value)} placeholder="Nome do produto..." />
            <br/>
            <input onChange={e => alteraPreco(e.target.value)} placeholder="Preço..." />
            <br/>
            <input onChange={e => alteraTamanho(e.target.value)} placeholder="Tamanho..." />
            <br/>
            <input onChange={e => alteraDescricao(e.target.value)} placeholder="Descrição (opcional)..." />
            <br/>
            <button onClick={inserir} >Salvar</button>

            { produtos.map( i => <p>{i.nome} - R$ {i.preco} | Descrição: {i.descricao} </p> ) }

        </div>
    );
}

export default App;