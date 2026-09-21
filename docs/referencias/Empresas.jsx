import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./Empresas.css"

function Empresas() {

    const [ empresas, alteraEmpresas ] = useState([])
    const [ funcionarios, alteraFuncionarios ] = useState([])

    const [ exibeEmpresas, alteraExibeEmpresas ] = useState(true)
    const [ exibeFuncionarios, alteraExibeFuncionarios ] = useState(false)
    const [ exibeModal, alteraExibeModal ] = useState(false)

    const [ idEmpresa, alteraIdEmpresa ] = useState("")
    const [ nome, alteraNome ] = useState("")
    const [ contato, alteraContato ] = useState("")
    const [ cargo, alteraCargo ] = useState(1)

    async function inserirFuncionario(){
        const obj = {
            id_empresa: parseInt(idEmpresa),
            nome: nome,
            contato: contato,
            cargo: parseInt(cargo)
        }

        const {error} = await supabase.from("funcionarios").insert(obj)

        if(error == null){
            alert("Funcionário cadastrado com sucesso!")
            alteraExibeModal(false)
            buscaFuncionariosPorEmpresa(idEmpresa)
        }else{
            alert("Erro ao cadastrar funcionário. Entre em contato com o suporte técnico.")
            console.log(error)
        }

    }

    async function buscaTodasEmpresas(){
        const {error, data} = await supabase.from("empresas").select()
        //console.log(data)
        alteraEmpresas(data)
    }

    async function buscaTodosFuncionarios(){
        const {error, data} = await supabase.from("funcionarios").select("*, empresas(*)")                                   
        console.log(data)
        alteraFuncionarios(data)
    }

    async function buscaFuncionariosPorEmpresa(id_empresa){
        const {error, data} = await supabase.from("funcionarios").select("*, empresas(*)").eq("id_empresa", id_empresa)                                   
        console.log(data)
        alteraIdEmpresa(id_empresa)
        alteraFuncionarios(data)
    }

    function alternaVisualizacao(){

        if(exibeEmpresas == true){
            alteraExibeEmpresas(false)
            alteraExibeFuncionarios(true)
        }else{
            alteraExibeEmpresas(true)
            alteraExibeFuncionarios(false)
        }

    }

    useEffect( ()=>{
        buscaTodasEmpresas()
        buscaTodosFuncionarios()
    }, [] )

    return (
        <div>

            {
                exibeModal == true ?
                    <div>
                        <div onClick={ ()=> alteraExibeModal(false) } className="fundoPreto" ></div>
                        <div className="modal" >
                            <h2>Novo Funcionário</h2>
                            <input onChange={ (e)=> alteraNome(e.target.value) } placeholder="Nome..." />
                            <br/>
                            <input onChange={ (e)=> alteraContato(e.target.value) } placeholder="Contato..." />
                            <br/>
                            <select onChange={ (e)=> alteraCargo(e.target.value) }>
                                <option value="1" >Funcionário comum</option>
                                <option value="0" >Administrador</option>
                            </select>
                            <br/>
                            <button onClick={inserirFuncionario} >Salvar</button>
                        </div>
                    </div>
                :
                    <></>
            }

            <h1>Relacionamento de Tabelas</h1>
            <p>Consulta na tabela empresas e funcionários</p>

            {
                exibeEmpresas == true ?
                    <div>
                        <h2>Empresas</h2>

                        <table border="true" >
                            <tr>
                                <td>ID</td>
                                <td>Nome</td>
                                <td>CNPJ</td>
                                <td>Endereço</td>
                                <td>Ações</td>
                            </tr>
                            {
                                empresas.map( i => 
                                    <tr>
                                        <td>{i.id}</td>
                                        <td>{i.nome}</td>
                                        <td>{i.cnpj}</td>
                                        <td>{i.endereco}</td>
                                        <td> <button onClick={ ()=>{ buscaFuncionariosPorEmpresa(i.id); alternaVisualizacao() } } >Ver funcionários</button> </td>
                                    </tr>
                                )
                            }
                        </table>
                    </div>
                :
                    <></>
            }

            {
                exibeFuncionarios == true ?
                    <div>
                        <h2>Funcionários</h2>

                        <button onClick={ ()=>{alternaVisualizacao(); alteraIdEmpresa("") }  } >Voltar</button>
                        <br/><br/>
                        <button onClick={ ()=> alteraExibeModal(true) } >Adicionar novo</button>
                        <br/><br/>

                        <table border="true" >
                            <tr>
                                <td>ID</td>
                                <td>Nome</td>
                                <td>Nome da Empresa</td>
                                <td>Endereço da Empresa</td>
                                <td>Cargo</td>
                                <td>Contato</td>
                            </tr>
                            {
                                funcionarios.map(i => 
                                    <tr>
                                        <td>{i.id}</td>
                                        <td>{i.nome}</td>
                                        <td>{i.empresas.nome}</td>
                                        <td>{i.empresas.endereco}</td>
                                        <td>{i.cargo == 0 ? "Administrador" : "Funcionário comum"}</td>
                                        <td>{i.contato}</td>
                                    </tr>
                                )
                            }
                        </table>
                    </div>
                :
                    <></>
            }

        </div>
    );
}

export default Empresas;