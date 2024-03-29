import React, { useCallback, useEffect, useRef, useState } from "react"
import { MoorhenMolecule } from "../../utils/MoorhenMolecule"
import { MoorhenMoleculeSelect } from "../select/MoorhenMoleculeSelect"
import { Dropdown, Form, InputGroup, SplitButton } from "react-bootstrap"
import { MoorhenBaseMenuItem } from "./MoorhenBaseMenuItem"
import { TextField } from "@mui/material"
import { readTextFile } from "../../utils/MoorhenUtils"
import { moorhen } from "../../types/moorhen";
import { webGL } from "../../types/mgWebGL";
import { libcootApi } from "../../types/libcoot"

const MoorhenImportLigandDictionary = (props: { 
    id: string;
    menuItemText: string;
    createInstance: boolean;
    setCreateInstance: React.Dispatch<React.SetStateAction<boolean>>;
    molecules: moorhen.Molecule[];
    glRef: React.RefObject<webGL.MGWebGL>;
    commandCentre: React.RefObject<moorhen.CommandCentre>;
    defaultBondSmoothness: number;
    monomerLibraryPath: string;
    backgroundColor: [number, number, number, number];
    panelContent: JSX.Element;
    changeMolecules: (arg0: moorhen.MolChange<moorhen.Molecule>) => void;
    fetchLigandDict: () => Promise<string>;
    addToMoleculeValueRef: React.MutableRefObject<number>;
    addToMolecule: string;
    setAddToMolecule: React.Dispatch<React.SetStateAction<string>>;
    setPopoverIsShown: React.Dispatch<React.SetStateAction<boolean>>;
    tlcValueRef: React.RefObject<string>;
    createRef: React.MutableRefObject<boolean>;
    moleculeSelectRef: React.RefObject<HTMLSelectElement>;
    addToRef: React.RefObject<HTMLSelectElement>;
    moleculeSelectValueRef: React.MutableRefObject<string>;
}) => {

    const {
        createInstance, setCreateInstance, addToMolecule, fetchLigandDict, panelContent,
        setAddToMolecule, tlcValueRef, createRef, moleculeSelectRef, addToRef,moleculeSelectValueRef,
        addToMoleculeValueRef, setPopoverIsShown, molecules, glRef, commandCentre, menuItemText,
        changeMolecules, backgroundColor, monomerLibraryPath, defaultBondSmoothness, id
    } = props

    const handleFileContent = useCallback(async (fileContent: string) => {
        let newMolecule: moorhen.Molecule
        let selectedMoleculeIndex: number
        
        if (moleculeSelectValueRef.current) {
            selectedMoleculeIndex = parseInt(moleculeSelectValueRef.current)
            const selectedMolecule = molecules.find(molecule => molecule.molNo === selectedMoleculeIndex)
            if (typeof selectedMolecule !== 'undefined') {
                selectedMolecule.addDict(fileContent)
            }
        } else {
            selectedMoleculeIndex = -999999
            await Promise.all([
                commandCentre.current.cootCommand({
                    returnType: "status",
                    command: 'shim_read_dictionary',
                    commandArgs: [fileContent, selectedMoleculeIndex],
                    changesMolecules: []
                }, true),
                ...molecules.map(molecule => {
                    molecule.addDictShim(fileContent)
                    return molecule.redraw(glRef)
                })
            ])
            
        }
                
        if (createRef.current) {
            const instanceName = tlcValueRef.current
            const result = await commandCentre.current.cootCommand({
                returnType: 'status',
                command: 'get_monomer_and_position_at',
                commandArgs: [instanceName,
                    selectedMoleculeIndex,
                    ...glRef.current.origin.map(coord => -coord)]
            }, true) as moorhen.WorkerResponse<number> 
            if (result.data.result.status === "Completed") {
                newMolecule = new MoorhenMolecule(commandCentre, monomerLibraryPath)
                newMolecule.molNo = result.data.result.result
                newMolecule.name = instanceName
                newMolecule.setBackgroundColour(backgroundColor)
                newMolecule.cootBondsOptions.smoothness = defaultBondSmoothness
                await newMolecule.addDict(fileContent)
                changeMolecules({ action: "Add", item: newMolecule })
                await newMolecule.fetchIfDirtyAndDraw("CBs", glRef)
                if (addToMoleculeValueRef.current !== -1) {
                    const toMolecule = molecules.find(molecule => molecule.molNo === addToMoleculeValueRef.current)
                    if (typeof toMolecule !== 'undefined') {
                        const otherMolecules = [newMolecule]
                        await toMolecule.mergeMolecules(otherMolecules, glRef, true)
                        const scoresUpdateEvent: moorhen.ScoresUpdateEvent = new CustomEvent("scoresUpdate", { detail: { origin: glRef.current.origin, modifiedMolecule: toMolecule.molNo } })
                        document.dispatchEvent(scoresUpdateEvent)
                        await toMolecule.redraw(glRef)
                    } else {
                        await newMolecule.redraw(glRef)
                    }
                }
            }
        }

        setPopoverIsShown(false)

    }, [moleculeSelectValueRef, createRef, setPopoverIsShown, molecules, commandCentre, glRef, tlcValueRef, monomerLibraryPath, backgroundColor, defaultBondSmoothness, changeMolecules, addToMoleculeValueRef])

    const popoverContent = <>
            {panelContent}
            <MoorhenMoleculeSelect {...props} allowAny={true} ref={moleculeSelectRef} label="Make monomer available to" onChange={(evt) => {
                moleculeSelectValueRef.current = evt.target.value
        }}/>
            <Form.Group key="createInstance" style={{ width: '20rem', margin: '0.5rem' }} controlId="createInstance" className="mb-3">
                <Form.Label>Create instance on read</Form.Label>
                <InputGroup>
                    <SplitButton title={createInstance ? "Yes" : "No"} id="segmented-button-dropdown-1">
                        {/* @ts-ignore */}
                        <Dropdown.Item key="Yes" href="#" onClick={() => {
                            createRef.current = true
                            setCreateInstance(true)
                        }}>Yes</Dropdown.Item>
                        <Dropdown.Item key="No" href="#" onClick={() => {
                            createRef.current = false
                            setCreateInstance(false)
                        }}>No</Dropdown.Item>
                    </SplitButton>
                    <Form.Select disabled={!createInstance} ref={addToRef} value={addToMolecule} onChange={(e) => {
                        setAddToMolecule(e.target.value)
                        addToMoleculeValueRef.current = parseInt(e.target.value)
                    }}>
                        <option key={-1} value={"-1"}>{createInstance ? "...create new molecule" : ""}</option>
                        {props.molecules.map(molecule => <option key={molecule.molNo} value={molecule.molNo}>
                            ...add to {molecule.name}
                        </option>)}
                    </Form.Select>
                </InputGroup>
            </Form.Group>
    </>

    const onCompleted = useCallback(async () => {
        const ligandDict = await fetchLigandDict()
        if (ligandDict) {
            handleFileContent(ligandDict)
        } else {
            console.log('Unable to get ligand dict...')
        }
    }, [handleFileContent, fetchLigandDict])
    
    return <MoorhenBaseMenuItem
        id={id}
        popoverContent={popoverContent}
        menuItemText={menuItemText}
        onCompleted={onCompleted}
        setPopoverIsShown={setPopoverIsShown}
    />

}

export const MoorhenSMILESToLigandMenuItem = (props: {
    changeMolecules: (arg0: moorhen.MolChange<moorhen.Molecule>) => void;
    setPopoverIsShown: React.Dispatch<React.SetStateAction<boolean>>;
    molecules: moorhen.Molecule[];
    glRef: React.RefObject<webGL.MGWebGL>;
    commandCentre: React.RefObject<moorhen.CommandCentre>;
    defaultBondSmoothness: number;
    monomerLibraryPath: string;
    backgroundColor: [number, number, number, number];
}) => {

    const [smile, setSmile] = useState<string>('')
    const [tlc, setTlc] = useState<string>('')
    const [createInstance, setCreateInstance] = useState<boolean>(true)
    const [addToMolecule, setAddToMolecule] = useState<string>('')
    const [conformerCount, setConformerCount] = useState<number>(10)
    const [iterationCount, setIterationCount] = useState<number>(100)
    const smileRef = useRef<null | string>(null)
    const tlcValueRef = useRef<null | string>(null)
    const createRef = useRef<boolean>(true)
    const moleculeSelectRef = useRef<null | HTMLSelectElement>(null)
    const moleculeSelectValueRef = useRef<null | string>(null)
    const addToRef = useRef<null | HTMLSelectElement>(null)
    const addToMoleculeValueRef = useRef<null | number>(null)
    const conformerCountRef = useRef<number>(10)
    const iterationCountRef = useRef<number>(100)

    const collectedProps = {
        smile, setSmile, tlc, setTlc, createInstance, setCreateInstance, addToMolecule,
        setAddToMolecule, smileRef, tlcValueRef, createRef, moleculeSelectRef, addToRef,
        addToMoleculeValueRef, moleculeSelectValueRef, ...props
    }

    const smilesToPDB = async (): Promise<string> => {
        if (!smileRef.current) {
            console.log('Empty smile, do nothing...')
            return
        }

        let n_conformer: number
        let n_iteration: number
        try {
            n_conformer = conformerCountRef.current
            n_iteration = iterationCountRef.current
        } catch (err) {
            console.log(err)
            return
        }

        if ( (isNaN(n_conformer) || n_conformer < 0 || n_conformer === Infinity) || 
            (isNaN(n_iteration) || n_iteration < 0 || n_iteration === Infinity) ) {
            console.log('Unable to parse n_conformer / n_iteration count into a valid int...')
            return
        }

        const response = await props.commandCentre.current.cootCommand({
            command: 'shim_smiles_to_pdb',
            commandArgs: [smileRef.current, tlcValueRef.current, n_conformer, n_iteration],
            returnType: 'str_str_pair'
        }, true) as moorhen.WorkerResponse<libcootApi.PairType<string, string>>
        const result = response.data.result.result.second

        if (result) {
            return result
        } else {
            console.log('Error creating molecule... Wrong SMILES?')
            props.commandCentre.current.extendConsoleMessage('Error creating molecule... Wrong SMILES?')
        }
    }

    const panelContent = <>
        <Form.Group key="smile" style={{ width: '20rem', margin: '0.5rem' }} controlId="tlc" className="mb-3">
            <Form.Label>Type a smile</Form.Label>
            <Form.Control value={smile} type="text" 
                onChange={(e) => {
                    setSmile(e.target.value)
                    smileRef.current = e.target.value
                }}/>
        </Form.Group>            
        <Form.Group key="tlc" style={{ width: '20rem', margin: '0.5rem' }} controlId="tlc" className="mb-3">
            <Form.Label>Assign a name</Form.Label>
            <Form.Control value={tlc} type="text" 
                onChange={(e) => {
                    setTlc(e.target.value)
                    tlcValueRef.current = e.target.value
                }}/>
        </Form.Group>
        <Form.Group>
            <TextField
                style={{margin: '0.5rem', width: '9rem'}} 
                id='conformer-count'
                label='No. of conformers'
                type='number'
                variant="standard"
                error={isNaN(conformerCount) || conformerCount < 0 || conformerCount === Infinity}
                value={conformerCount}
                onChange={(evt) => {
                    conformerCountRef.current = parseInt(evt.target.value)
                    setConformerCount(parseInt(evt.target.value))
                }}
            />
            <TextField
                style={{margin: '0.5rem', width: '9rem'}} 
                id='iteration-count'
                label='No. of iterations'
                type='number'
                variant="standard"
                error={isNaN(iterationCount) || iterationCount < 0 || iterationCount === Infinity}
                value={iterationCount}
                onChange={(evt) => {
                    iterationCountRef.current = parseInt(evt.target.value)
                    setIterationCount(parseInt(evt.target.value))
                }}
            />
        </Form.Group>
    </>

    return <MoorhenImportLigandDictionary id='smiles-to-ligand-menu-item' menuItemText="From SMILES..." panelContent={panelContent} fetchLigandDict={smilesToPDB} {...collectedProps} />
}

export const MoorhenImportDictionaryMenuItem = (props: { 
    changeMolecules: (arg0: moorhen.MolChange<moorhen.Molecule>) => void;
    setPopoverIsShown: React.Dispatch<React.SetStateAction<boolean>>;
    molecules: moorhen.Molecule[];
    glRef: React.RefObject<webGL.MGWebGL>;
    commandCentre: React.RefObject<moorhen.CommandCentre>;
    defaultBondSmoothness: number;
    monomerLibraryPath: string;
    backgroundColor: [number, number, number, number];
 }) => {
    const filesRef = useRef<null | HTMLInputElement>(null)
    const moleculeSelectRef = useRef<null | HTMLSelectElement>(null)
    const moleculeSelectValueRef = useRef<null | string>(null)
    const [tlc, setTlc] = useState<string>('')
    const addToRef = useRef<null | HTMLSelectElement>(null)
    const [addToMolecule, setAddToMolecule] = useState<string>('')
    const addToMoleculeValueRef = useRef<null | number>(null)
    const [fileOrLibrary, setFileOrLibrary] = useState<string>("Library")
    const fileOrLibraryRef = useRef<string>("Library")
    const [createInstance, setCreateInstance] = useState<boolean>(true)
    const [tlcsOfFile, setTlcsOfFile] = useState([])
    const tlcSelectRef = useRef<null | HTMLSelectElement>(null)
    const tlcValueRef = useRef<null | string>(null)
    const createRef = useRef<boolean>(true)

    const collectedProps = {
        tlc, setTlc, createInstance, setCreateInstance, addToMolecule,
        setAddToMolecule, tlcValueRef, createRef, moleculeSelectRef, addToRef,
        addToMoleculeValueRef, moleculeSelectValueRef, ...props
    }

    const panelContent = <>
        <Form.Group key="fileOrLibrary" style={{ width: '20rem', margin: '0.5rem' }} controlId="fileOrLibrary" className="mb-3">
            <Form.Label>Select a source</Form.Label>
            <Form.Select value={fileOrLibrary} onChange={(e) => { setFileOrLibrary(e.target.value) }}>
                <option key="File" value="File">From local file</option>
                <option key="Library" value="Library">From monomer library</option>
                <option key="MRC" value="MRC">Fetch from MRC-LMB</option>
            </Form.Select>
        </Form.Group>
        {fileOrLibrary === 'File' ? <>
            <Form.Group key="uploadDicts" style={{ width: '20rem', margin: '0.5rem' }} controlId="uploadDicts" className="mb-3"
                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    const fileContent = await readTextFile(e.target.files[0]) as string
                    const rx = /data_comp_(.*)/g;
                    const tlcs = [...fileContent.matchAll(rx)].map(array => array[1]).filter(item => item !== 'list')
                    if (tlcs.length > 0) {
                        setTlcsOfFile(tlcs)
                        setTlc(tlcs[0])
                        tlcValueRef.current = tlcs[0]
                    }
                }}>
                <Form.Label>Browse...</Form.Label>
                <Form.Control ref={filesRef} type="file" accept={".cif, .dict, .mmcif"} multiple={false} />
            </Form.Group>
            {createInstance &&
                <Form.Select ref={tlcSelectRef} value={tlc} onChange={(newVal) => { setTlc(newVal.target.value) }} style={{ width: '20rem', margin: '0.5rem' }} >
                    {tlcsOfFile.map(tlcOfFile => <option key={tlcOfFile} value={tlcOfFile}>{tlcOfFile}</option>)}
                </Form.Select>
            }
        </>
        :
            <Form.Group key="tlc" style={{ width: '20rem', margin: '0.5rem' }} controlId="tlc" className="mb-3">
                <Form.Label>Three letter code</Form.Label>
                <Form.Control value={tlc}
                    onChange={(e) => {
                        setTlc(e.target.value)
                        tlcValueRef.current = e.target.value
                    }}
                    type="text" />
            </Form.Group>
        }
    </>

    useEffect(() => {
        fileOrLibraryRef.current = fileOrLibrary
    }, [fileOrLibrary])

    const readMonomerFile = async (newTlc: string): Promise<string>  => {
        return fetch(`${props.monomerLibraryPath}/${newTlc.toLowerCase()[0]}/${newTlc.toUpperCase()}.cif`)
            .then(response => response.text())
            .then(fileContent => {
                return fileContent
            })
        }

    const fetchFromMrcLmb = async (newTlc: string): Promise<string>  => {
        const url = `https://raw.githubusercontent.com/MRC-LMB-ComputationalStructuralBiology/monomers/master/${newTlc.toLowerCase()[0]}/${newTlc.toUpperCase()}.cif`
        const response = await fetch(url)
        if (!response.ok) {
            console.log(`Cannot fetch data from https://raw.githubusercontent.com/MRC-LMB-ComputationalStructuralBiology/monomers/master/${newTlc.toLowerCase()[0]}/${newTlc.toUpperCase()}.cif`)
        } else {
            const fileContent = await response.text()
            return fileContent
        }
    }

    const fetchLigandDict = async (): Promise<string> => {
        if (fileOrLibraryRef.current === "File") {
            return readTextFile(filesRef.current.files[0]) as Promise<string>
        }
        else if (fileOrLibraryRef.current === "Library") {
            return readMonomerFile(tlcValueRef.current)
        } else if (fileOrLibraryRef.current === "MRC") {
            return fetchFromMrcLmb(tlcValueRef.current)
        } else {
            console.log(`Unkown ligand source ${fileOrLibraryRef.current}`)
        }

    }

    return <MoorhenImportLigandDictionary id='import-dict-menu-item' menuItemText="Import dictionary..." panelContent={panelContent} fetchLigandDict={fetchLigandDict} {...collectedProps} />
}
