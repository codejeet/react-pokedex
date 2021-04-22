import Head from "next/head";
import styles from "../styles/Home.module.css";
import useSWR from "swr";
import { useState } from "react";
import { useEffect } from "react";
const fetcher = (url) => fetch(url).then((r) => r.json());

interface Ability2 {
  name: string;
  url: string;
}

interface Ability {
  ability: Ability2;
  is_hidden: boolean;
  slot: number;
}

interface Form {
  name: string;
  url: string;
}

interface Version {
  name: string;
  url: string;
}

interface Move2 {
  name: string;
  url: string;
}
interface Move {
  move: Move2;
}

interface Type2 {
  //grass, fire, etc
  name: string;
  url: string;
}

interface Type {
  slot: number;
  type: Type2;
}

interface apiResponse {
  abilities: Ability[];
  base_experience: number;
  forms: Form[];
  height: number;
  moves: Move[];
  types: Type[];
  name: string;
  weight: number;
}

//Helper functions
async function getData(pokemonArray: any[]) {
  const data = Promise.all(
    pokemonArray.map(async (pokemon) => await (await fetch(pokemon.url)).json())
  );
  return data;
}

function calculateExp(data: apiResponse[]) {
  return data.reduce((a, b) => (a.base_experience > b.base_experience ? a : b))
    .name;
}

const findAvg = (x) => x.reduce((a, b) => a + b) / x.length;

function calcAvgWeight(data: apiResponse[]) {
  return findAvg(data.map((x) => x.weight));
}

function paginate(array, size, index) {
  return array.slice((index - 1) * size, index * size);
}
function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue((value) => value + 1); // update the state to force render
}

export default function Home() {
  //Fetch data with params
  const { data, error } = useSWR(
    `https://pokeapi.co/api/v2/pokemon?limit=${60}`,
    fetcher
  );

  //Mutable data state
  const [dataState, setDataState] = useState([{}] as apiResponse[]);
  const [avgWeight, setAvgWeight] = useState(0);
  const [page, setPage] = useState(1);

  const forceUpdate = useForceUpdate();

  const [filter, setFilter] = useState("");
  const [sortby, setSortBy] = useState("");
  const [order, toggleOrder] = useState(false);

  const [mostExp, setMostExp] = useState("");

  useEffect(() => {
    setMostExp(calculateExp(dataState));
    setAvgWeight(calcAvgWeight(dataState));
  }, [dataState]);

  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  //Resolve pokemon urls
  if (dataState.length <= 1) {
    getData(data?.results).then((data) => {
      setDataState(data);
    });
  }

  const toggleSortFunc = (a, b) =>
    a[sortby] > b[sortby] ? (order ? 1 : -1) : order ? -1 : 1;

  const filterElms =
    filter !== "" &&
    dataState.length > 1 &&
    dataState
      .sort(toggleSortFunc)
      .map((elm) => {
        if (elm.types.map((x) => x.type.name).includes(filter)) {
          return getTableRow(elm);
        }
      })
      .filter(Boolean);

  const noFilterElms =
    filter == "" &&
    dataState.length > 1 &&
    dataState
      .sort(toggleSortFunc)
      .map((elm) => {
        return getTableRow(elm);
      })
      .filter(Boolean);

  const sorry = filter !== "" && !!!filterElms.length && (
    <h1>No pokemon match that type - try another one!</h1>
  );

  //Page helpers
  const pageWidth: number = 20;
  const maxPage = Math.ceil((filterElms || noFilterElms).length / pageWidth);
  const pageConstrain = (x) => Math.min(maxPage, Math.max(x, 1));

  const toggleOnClick = (e: any, column: string) => {
    e.preventDefault();
    setSortBy(column);
    toggleOrder((x) => !x);
  };
  const dropdownOptions: string[] = [
    "normal",
    "fire",
    "water",
    "grass",
    "electric",
    "ice",
    "fighting",
    "poison",
    "ground",
    "flying",
    "psychic",
    "bug",
    "rock",
    "ghost",
    "dark",
    "dragon",
    "steel",
    "fairy",
  ];
  return (
    <div className={styles.container}>
      <Head>
        <title>Forum One Challenge</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1>React Pokédex</h1>

      <div className={styles.topbox}>
        <div className={styles.optionsbox}>
          <div>Average Weight:</div> <div>{avgWeight} hectograms</div>
        </div>
        <div className={styles.optionsbox}>
          <div>Most Experienced:</div> <div>{mostExp}</div>
        </div>
        <form
          onChange={(e: any) => {
            e.preventDefault();
            setPage(1);
            setFilter(e.target.value);
          }}
          className={styles.form}
        >
          <div>Choose a type: </div>
          <select id="type" name="type">
            <option value={""}>any</option>
            {dropdownOptions.map((x) => (
              <option key={x + "option"} value={x}>
                {x}
              </option>
            ))}
          </select>
        </form>
      </div>

      <div className={styles.paginator}>
        {!sorry && (
          <>
            <button
              onClick={(e: any) => {
                e.preventDefault();
                setPage(pageConstrain(page - 1));
              }}
            >
              Prev
            </button>
            <div className={styles.pageText}>
              {page} / {maxPage}
            </div>
            <button
              onClick={(e: any) => {
                e.preventDefault();
                setPage(pageConstrain(page + 1));
              }}
            >
              Next
            </button>
          </>
        )}
      </div>
      <div className={styles.main}>
        <table>
          {!sorry && (
            <tr>
              <td onClick={(e) => toggleOnClick(e, "name")}>Pokemon</td>
              <td onClick={(e) => toggleOnClick(e, "height")}>
                Height (decimetres)
              </td>
              <td onClick={(e) => toggleOnClick(e, "weight")}>
                Weight (hectograms)
              </td>
              <td onClick={(e) => toggleOnClick(e, "abilities")}>Abilities</td>
              {/* <td onClick={(e) => toggleOnClick(e, "type")}>Type</td> */}
            </tr>
          )}
          {filterElms && paginate(filterElms, pageWidth, page)}
          {noFilterElms && paginate(noFilterElms, pageWidth, page)}
        </table>
        {sorry}
      </div>
    </div>
  );
}

function getTableRow(elm) {
  return (
    <tr key={elm.name + "tr"}>
      <td key={elm.name + "_key"}>
        <div className={styles.profile}>
          <p>{elm.name}</p>
          <img src={elm.sprites.front_default}></img>{" "}
        </div>
      </td>
      <td key={elm.name + elm.height + "_key"}>{elm.height}</td>
      <td key={elm.name + elm.weight + "_key"}>{elm.weight}</td>
      <td key={elm.name + "abilities"}>{`${elm.abilities.map(
        (x) => ` ${x.ability.name}`
      )}`}</td>
      {/* <td key={elm.name + "type"}>{`${elm.types.map(
        (x) => ` ${x.type.name}`
      )}`}</td> */}
    </tr>
  );
}
