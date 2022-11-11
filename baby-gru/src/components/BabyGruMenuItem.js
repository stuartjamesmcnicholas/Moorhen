import { MenuItem } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { OverlayTrigger, Popover, PopoverBody, PopoverHeader, Form, InputGroup, Button, FormSelect, Row, Col } from "react-bootstrap";
import { SketchPicker } from "react-color";
import { BabyGruMtzWrapper, readTextFile } from "../utils/BabyGruUtils";
import { BabyGruMap } from "../utils/BabyGruMap";
import { BabyGruMolecule } from "./BabyGruMolecule";
import { BabyGruMoleculeSelect } from "./BabyGruMoleculeSelect";
import BabyGruSlider from "./BabyGruSlider";

export const BabyGruMenuItem = (props) => {

    const resolveOrRejectRef = useRef({
        resolve: () => { },
        reject: () => { }
    })

    return <>
        {props.popoverContent ? <OverlayTrigger
            rootClose
            placement={props.popoverPlacement}
            trigger="click"

            onEntered={() => {
                props.setPopoverIsShown(true)
            }}

            onExit={() => {
                props.setPopoverIsShown(false)
            }}

            onEnter={() => {
                new Promise((resolve, reject) => {
                    resolveOrRejectRef.current = { resolve, reject }
                }).then(result => {
                    props.onCompleted("Resolve")
                    document.body.click()
                })
            }}

            overlay={
                <Popover style={{ maxWidth: "40rem" }}>
                    <PopoverHeader as="h3">{props.menuItemTitle}</PopoverHeader>
                    <PopoverBody>
                        {props.popoverContent}
                        <Button variant={props.buttonVariant} onClick={() => { resolveOrRejectRef.current.resolve() }}>{props.buttonText}</Button>
                    </PopoverBody>
                </Popover>}
        >
            <MenuItem className={props.textClassName} variant="success">{props.menuItemText}</MenuItem>
        </OverlayTrigger> :
            <MenuItem className={props.textClassName} variant="success">{props.menuItemText}</MenuItem>
        }
    </>
}

BabyGruMenuItem.defaultProps = {
    buttonText: "OK",
    buttonVariant: "primary",
    textClassName: "",
    popoverPlacement: "right"
}

export const BabyGruLoadTutorialDataMenuItem = (props) => {
    const tutorialNumberSelectorRef = useRef(null);
    const allTutorialNumbers = [1, 2]

    const panelContent = <>
        <Form.Group style={{ width: '20rem', margin: '0.5rem' }} controlId="loadTutorialData" className="mb-3">
            <Form.Label>Select tutorial number</Form.Label>
            <Form.Select ref={tutorialNumberSelectorRef} >
                {allTutorialNumbers.map(tutorialNumber => {
                    return <option key={tutorialNumber} value={tutorialNumber}>{`Tutorial ${tutorialNumber}`}</option>
                })}
            </Form.Select>
        </Form.Group>
    </>

    const onCompleted = () => {
        const tutorialNumber = tutorialNumberSelectorRef.current.value
        console.log(`Loading data for tutorial number ${tutorialNumber}`)
        const newMolecule = new BabyGruMolecule(props.commandCentre)
        const newMap = new BabyGruMap(props.commandCentre)
        const newDiffMap = new BabyGruMap(props.commandCentre)
        newMolecule.loadToCootFromURL(`./tutorials/moorhen-tutorial-structure-number-${tutorialNumber}.pdb`, `moorhen-tutorial-${tutorialNumber}`)
            .then(result => {
                newMolecule.fetchIfDirtyAndDraw('CBs', props.glRef, true)
            }).then(result => {
                props.setMolecules([...props.molecules, newMolecule])
                Promise.resolve(newMolecule)
            }).then(_ => {
                newMolecule.centreOn(props.glRef)
            }).then(_ => {
                return newMap.loadToCootFromURL(`./tutorials/moorhen-tutorial-map-number-${tutorialNumber}.mtz`, `moorhen-tutorial-${tutorialNumber}`,
                    { F: "FWT", PHI: "PHWT", isDifference: false, useWeight: false })
            }).then(_ => {
                return newDiffMap.loadToCootFromURL(`./tutorials/moorhen-tutorial-map-number-${tutorialNumber}.mtz`, `moorhen-tutorial-${tutorialNumber}`,
                    { F: "DELFWT", PHI: "PHDELWT", isDifference: true, useWeight: false })
            }).then(_ => {
                props.setMaps([...props.maps, newMap, newDiffMap])
                props.setActiveMap(newMap)
            })
        props.setPopoverIsShown(false)
    }

    return <BabyGruMenuItem
        popoverContent={panelContent}
        menuItemText="Load tutorial data..."
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}


export const BabyGruGetMonomerMenuItem = (props) => {
    const tlcRef = useRef()
    const selectRef = useRef(null)

    const panelContent = <>
        <Form.Group style={{ width: '20rem', margin: '0.5rem' }} controlId="BabyGruGetMonomerMenuItem" className="mb-3">
            <Form.Label>Monomer identifier</Form.Label>
            <Form.Control ref={tlcRef} type="text" />
        </Form.Group>
        <BabyGruMoleculeSelect {...props} allowAny={true} ref={selectRef} />
    </>


    const onCompleted = () => {
        props.commandCentre.current.cootCommand({
            returnType: 'status',
            command: 'get_monomer_and_position_at',
            commandArgs: [tlcRef.current.value, selectRef.current.value, ...props.glRef.current.origin.map(coord => -coord)]

        }, true)
            .then(result => {
                if (result.data.result.status === "Completed") {
                    const newMolecule = new BabyGruMolecule(props.commandCentre)
                    newMolecule.coordMolNo = result.data.result.result
                    newMolecule.name = tlcRef.current.value
                    props.setPopoverIsShown(false)
                    newMolecule.fetchIfDirtyAndDraw('CBs', props.glRef).then(_ => {
                        newMolecule.cachedAtoms.sequences = []
                        props.setMolecules([...props.molecules, newMolecule])
                    })
                }
            })
    }

    return <BabyGruMenuItem
        popoverContent={panelContent}
        menuItemText="Get monomer..."
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}

export const BabyGruDeleteDisplayObjectMenuItem = (props) => {

    const panelContent = <>
        <Form.Group style={{ width: '10rem', margin: '0.5rem' }} controlId="BabyGruGetDeleteMenuItem" className="mb-3">
            <span style={{ fontWeight: 'bold' }}>Are you sure?</span>
        </Form.Group>
    </>

    const onCompleted = () => {
        let newItemList = props.itemList.filter(item => props.item.mapMolNo ? item.mapMolNo !== props.item.mapMolNo : item.coordMolNo !== props.item.coordMolNo)
        props.setItemList(newItemList)
        props.item.delete(props.glRef);
        props.setPopoverIsShown(false)
    }

    return <BabyGruMenuItem
        textClassName="text-danger"
        buttonVariant="danger"
        buttonText="Delete"
        popoverPlacement='left'
        popoverContent={panelContent}
        menuItemText={props.item.name ? "Delete molecule" : "Delete map"}
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}

export const BabyGruRenameDisplayObjectMenuItem = (props) => {
    const newNameInputRef = useRef(null)

    const panelContent = <>
        <Form.Group style={{ width: '10rem', margin: '0' }} controlId="BabyGruGetRenameMenuItem" className="mb-3">
            <Form.Control
                ref={newNameInputRef}
                type="text"
                name="newItemName"
                placeholder="New name"
            />
        </Form.Group>
    </>

    const onCompleted = () => {
        let newName = newNameInputRef.current.value
        if (newName == "") {
            return
        }
        props.item.name ? props.item.name = newName : props.item.mapName = newName
        props.setCurrentName(newName)
        props.setPopoverIsShown(false)
    }

    return <BabyGruMenuItem
        popoverPlacement='left'
        popoverContent={panelContent}
        menuItemText={props.item.name ? "Rename molecule" : "Rename map"}
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}


export const BabyGruDeleteEverythingMenuItem = (props) => {

    const panelContent = <>
        <Form.Group style={{ width: '18rem', margin: '0.5rem' }} controlId="BabyGruGetDeleteEverythingMenuItem" className="mb-3">
            <span style={{ fontWeight: 'bold' }}>Warning: this action cannot be reversed.</span>
        </Form.Group>
    </>


    const onCompleted = () => {
        props.maps.forEach(map => {
            map.delete(props.glRef)
        })
        props.molecules.forEach(molecule => {
            molecule.delete(props.glRef)
        })
        props.setMaps([])
        props.setMolecules([])
        props.setPopoverIsShown(false)
    }

    return <BabyGruMenuItem
        textClassName="text-danger"
        buttonVariant="danger"
        buttonText="I understand, delete"
        popoverContent={panelContent}
        menuItemText="Delete everything"
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}


export const BabyGruBackgroundColorMenuItem = (props) => {
    const [backgroundColor, setBackgroundColor] = useState({
        r: 128, g: 128, b: 128, a: 0.5
    })

    useEffect(() => {
        setBackgroundColor({
            r: 255 * props.backgroundColor[0],
            g: 255 * props.backgroundColor[1],
            b: 255 * props.backgroundColor[2],
            a: props.backgroundColor[3]
        })
    }, [props.backgroundColor])

    const handleColorChange = (color) => {
        try {
            props.setBackgroundColor([color.rgb.r / 255., color.rgb.g / 255., color.rgb.b / 255., color.rgb.a])
            setBackgroundColor(color)
        }
        catch (err) {
            console.log('err', err)
        }
    }
    const onCompleted = () => { props.setPopoverIsShown(false) }

    const panelContent = <>
        <SketchPicker color={backgroundColor} onChange={handleColorChange} />
    </>

    return <BabyGruMenuItem
        popoverContent={panelContent}
        menuItemText={<Form.Group style={{ minWidth: "20rem" }}>
            <Form.Label>BackgroundColor</Form.Label>
            <InputGroup>
                <Form.Control style={{
                    backgroundColor: `rgba(  ${backgroundColor.r}, ${backgroundColor.g},  ${backgroundColor.b},  ${backgroundColor.a})`
                }} type="text" />
                <Button variant="light">Change</Button>
            </InputGroup >
        </Form.Group>}
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown} />
}

export const BabyGruImportDictionaryMenuItem = (props) => {
    const filesRef = useRef(null)
    const moleculeSelectRef = useRef(null)
    const tlcRef = useRef(null)
    const [fileOrLibrary, setFileOrLibrary] = useState("Library")
    const [createInstance, setCreateInstance] = useState(true)
    const createInstanceRef = useRef()

    const panelContent = <>
        <Form.Group style={{ width: '20rem', margin: '0.5rem' }} controlId="fileOrLibrary" className="mb-3">
            <Form.Label>From file or monomer library</Form.Label>
            <Form.Select value={fileOrLibrary} onChange={(e) => { setFileOrLibrary(e.target.value) }}>
                <option value="File">From file</option>
                <option value="Library">From monomer library</option>
            </Form.Select>
        </Form.Group>
        {fileOrLibrary === 'File' &&
            <Form.Group style={{ width: '20rem', margin: '0.5rem' }} controlId="uploadDicts" className="mb-3">
                <Form.Label>Browse...</Form.Label>
                <Form.Control ref={filesRef} type="file" accept={[".cif", ".dict", ".mmcif"]} multiple={false} />
            </Form.Group>
        }
        {fileOrLibrary === 'Library' &&
            <Form.Group style={{ width: '20rem', margin: '0.5rem' }} controlId="uploadDicts" className="mb-3">
                <Form.Label>TLC from monomer lib</Form.Label>
                <Form.Control ref={tlcRef} type="text" />
            </Form.Group>
        }
        <BabyGruMoleculeSelect {...props} allowAny={true} ref={moleculeSelectRef} />
        <Form.Group style={{ width: '20rem', margin: '0.5rem' }} controlId="createInstance" className="mb-3">
            <Form.Label>Create instance on read</Form.Label>
            <Form.Check ref={createInstanceRef} checked={createInstance} onChange={(e) => {
                setCreateInstance(e.target.checked)
            }}
            />
        </Form.Group>
    </>

    const handleFileContent = (fileContent) => {
        return props.commandCentre.current.cootCommand({
            returnType: "status",
            command: 'shim_read_dictionary',
            commandArgs: [fileContent, moleculeSelectRef.current.value]
        }, true)
            .then(result => {
                props.molecules
                    .filter(molecule => molecule.coordMolNo === parseInt(moleculeSelectRef.current.value))
                    .forEach(molecule => {
                        molecule.redraw(props.glRef)
                    })
                return Promise.resolve()
            }).then(result => {
                if (createInstance) {
                    props.commandCentre.current.cootCommand({
                        returnType: 'status',
                        command: 'get_monomer_and_position_at',
                        commandArgs: [tlcRef.current.value.toUpperCase(), moleculeSelectRef.current.value, ...props.glRef.current.origin.map(coord => -coord)]

                    }, true)
                        .then(result => {
                            if (result.data.result.status === "Completed") {
                                const newMolecule = new BabyGruMolecule(props.commandCentre)
                                newMolecule.coordMolNo = result.data.result.result
                                newMolecule.name = tlcRef.current.value.toUpperCase()
                                newMolecule.fetchIfDirtyAndDraw('CBs', props.glRef).then(_ => {
                                    newMolecule.cachedAtoms.sequences = []
                                    props.setMolecules([...props.molecules, newMolecule])
                                })
                            }
                        })
                }
            })
    }

    const readMmcifFile = async (file) => {
        return readTextFile(file)
            .then(fileContent => {
                handleFileContent(fileContent)
            })
    }

    const readMonomerFile = async (tlc) => {
        console.log({ tlc })
        return fetch(`./monomers/${tlc.toLowerCase()[0]}/${tlc.toUpperCase()}.cif`)
            .then(response => response.text())
            .then(fileContent => {
                handleFileContent(fileContent)
            })
    }

    const onCompleted = async () => {
        if (fileOrLibrary === "File") {
            let readPromises = []
            for (const file of filesRef.current.files) {
                readPromises.push(readMmcifFile(file))
            }
            let mmcifReads = await Promise.all(readPromises)
        }
        else {
            readMonomerFile(tlcRef.current.value)
        }
        props.setPopoverIsShown(false)
    }

    return <BabyGruMenuItem
        popoverContent={panelContent}
        menuItemText="Import dictionary..."
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}

export const BabyGruImportMapCoefficientsMenuItem = (props) => {
    const filesRef = useRef(null)
    const fSelectRef = useRef()
    const phiSelectRef = useRef()
    const wSelectRef = useRef()
    const isDiffRef = useRef()
    const useWeightRef = useRef()
    const [columns, setColumns] = useState({})

    const handleFileRead = async (e) => {
        const newMap = new BabyGruMap(props.commandCentre)
        const babyGruMtzWrapper = new BabyGruMtzWrapper()
        const newColumns = await babyGruMtzWrapper.loadHeaderFromFile(e.target.files[0])
        const fColumns = Object.keys(newColumns)
            .filter(key => newColumns[key] === 'F')
        const pColumns = Object.keys(newColumns)
            .filter(key => newColumns[key] === 'P')
        const wColumns = Object.keys(newColumns)
            .filter(key => newColumns[key] === 'W')
        if (fColumns.length === 1 && fColumns.includes('FWT') &&
            pColumns.length === 1 && pColumns.includes('PHWT')) {
            let selectedColumns = { F: 'FWT', PHI: 'PHWT', W: '', isDifference: false, useWeight: false }
            await handleFile(e.target.files[0], selectedColumns)
        }
        else {
            setColumns(newColumns)
        }
    }

    const handleFile = async (file, selectedColumns) => {
        const newMap = new BabyGruMap(props.commandCentre)
        await newMap.loadToCootFromFile(file, selectedColumns)
        props.setMaps([...props.maps, newMap])
        props.setActiveMap(newMap)
    }

    const onCompleted = async () => {
        let selectedColumns = {
            F: fSelectRef.current.value, PHI: phiSelectRef.current.value, W: wSelectRef.current.value,
            isDifference: isDiffRef.current.checked, useWeight: useWeightRef.current.checked
        }
        props.setPopoverIsShown(false)
        return await handleFile(filesRef.current.files[0], selectedColumns)
    }

    const panelContent = <>
        <Row>
            <Form.Group style={{ width: '30rem', margin: '0.5rem' }} controlId="uploadDicts" className="mb-3">
                <Form.Label>Map coefficient files</Form.Label>
                <Form.Control ref={filesRef} type="file" multiple={false} accept={[".mtz"]} onChange={(e) => {
                    handleFileRead(e)
                }} />
            </Form.Group>
        </Row>
        <Row key="Row1" style={{ marginBottom: "1rem" }}>
            <Col key="F">
                Amplitude
                <FormSelect size="sm" ref={fSelectRef} defaultValue="FWT" onChange={(val) => { }}>
                    {Object.keys(columns)
                        .filter(key => columns[key] === 'F')
                        .map(key => <option value={key} key={key}>{key}</option>
                        )}
                </FormSelect>
            </Col>
            <Col key="Phi">
                Phase
                <FormSelect size="sm" ref={phiSelectRef} defaultValue="PHWT" onChange={(val) => { }}>
                    {Object.keys(columns)
                        .filter(key => columns[key] === 'P')
                        .map(key => <option value={key} key={key}>{key}</option>
                        )}
                </FormSelect>
            </Col>
            <Col key="Weight">
                Weight
                <FormSelect size="sm" ref={wSelectRef} defaultValue="FOM" onChange={(val) => { }}>
                    {Object.keys(columns)
                        .filter(key => columns[key] === 'W')
                        .map(key => <option value={key} key={key}>{key}</option>
                        )}
                </FormSelect>
            </Col>
        </Row>
        <Row style={{ marginBottom: "1rem" }}>
            <Col>
                <Form.Check label={'is diff map'} name={`isDifference`} type="checkbox" ref={isDiffRef} variant="outline" />
            </Col>
            <Col>
                <Form.Check label={'use weight'} name={`useWeight`} type="checkbox" ref={useWeightRef} variant="outline" />
            </Col>
        </Row>
    </>

    return <BabyGruMenuItem
        popoverContent={panelContent}
        menuItemText="Map coefficients..."
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}

export const BabyGruClipFogMenuItem = (props) => {

    const [zclipFront, setZclipFront] = useState(5)
    const [zclipBack, setZclipBack] = useState(5)
    const [zfogFront, setZfogFront] = useState(5)
    const [zfogBack, setZfogBack] = useState(5)

    useEffect(() => {
        if (props.glRef.current && props.glRef.current.gl_clipPlane0) {
            setZclipFront(500 + props.glRef.current.gl_clipPlane0[3])
            setZclipBack(props.glRef.current.gl_clipPlane1[3] - 500)
            setZfogFront(500 - props.glRef.current.gl_fog_start)
            setZfogBack(props.glRef.current.gl_fog_end - 500)
        }
    })

    const fractionalLog = (minVal, maxVal, val) => {
        if (minVal < 0.00001) minVal = 0.0001
        if (maxVal < 0.0001) maxVal = 0.0001
        if (val < 0.0001) val = 0.0001
        return 1 + 99 * ((Math.log10(val) - Math.log10(minVal)) / (Math.log10(maxVal) - Math.log10(minVal)))
    }

    const initialClipFront = fractionalLog(0.1, 1000, 500 + props.glRef.current.gl_clipPlane0[3])
    const initialClipBack = fractionalLog(0.1, 1000, props.glRef.current.gl_clipPlane1[3])
    const initialFogFront = fractionalLog(0.1, 1000, 500 - props.glRef.current.gl_fog_end)
    const initialFogBack = fractionalLog(0.1, 1000, props.glRef.current.gl_fog_end - 500)

    const panelContent = <div style={{ minWidth: "20rem" }}>
        <BabyGruSlider minVal={0.1} maxVal={1000} logScale={true}
            sliderTitle="Front clip"
            initialValue={initialClipFront}
            externalValue={zclipFront}
            setExternalValue={(newValue) => {
                props.glRef.current.gl_clipPlane0[3] = newValue - 500
                props.glRef.current.drawScene()
                setZclipFront(newValue)
            }} />
        <BabyGruSlider minVal={0.1} maxVal={1000} logScale={true}
            sliderTitle="Back clip"
            initialValue={initialClipBack}
            externalValue={zclipBack}
            setExternalValue={(newValue) => {
                props.glRef.current.gl_clipPlane1[3] = 500 + newValue
                props.glRef.current.drawScene()
                setZclipBack(newValue)
            }} />
        <BabyGruSlider minVal={0.1} maxVal={1000} logScale={true}
            sliderTitle="Front zFog"
            initialValue={initialFogFront}
            externalValue={zfogFront}
            setExternalValue={(newValue) => {
                props.glRef.current.gl_fog_start = 500 - newValue
                props.glRef.current.drawScene()
                setZfogFront(newValue)
            }} />
        <BabyGruSlider minVal={0.1} maxVal={1000} logScale={true}
            sliderTitle="Back zFog"
            externalValue={zfogBack}
            initialValue={initialFogBack}
            setExternalValue={(newValue) => {
                props.glRef.current.gl_fog_end = newValue + 500
                props.glRef.current.drawScene()
                setZfogBack(newValue)
            }} />
    </div>

    const onCompleted = () => { props.setPopoverIsShown(false) }

    return <BabyGruMenuItem
        popoverContent={panelContent}
        menuItemText="Clipping and fogging..."
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}

export const BabyGruMergeMoleculesMenuItem = (props) => {
    const toRef = useRef(null)
    const fromRef = useRef(null)
    const [selectedMolecules, setSelectedMolecules] = useState([])

    const panelContent = <>
        <BabyGruMoleculeSelect {...props} label="Into molecule" allowAny={false} ref={toRef} />
        <BabyGruMoleculeSelect {...props} label="From molecule" allowAny={false} ref={fromRef} />
    </>

    const onCompleted = useCallback(async () => {
        return props.commandCentre.current.cootCommand({
            command: 'merge_molecules',
            commandArgs: [parseInt(toRef.current.value), `${fromRef.current.value}`],
            returnType: "Status"
        }, true).then(result => {
            props.molecules
                .filter(molecule => molecule.coordMolNo === parseInt(toRef.current.value))
                .forEach(molecule => {
                    molecule.setAtomsDirty(true)
                    molecule.redraw(props.glRef)
                })
            props.molecules
                .filter(molecule => molecule.coordMolNo === parseInt(fromRef.current.value))
                .forEach(molecule => {
                    Object.keys(molecule.displayObjects).forEach(style => {
                        molecule.hide(style, props.glRef)
                    })
                })
            props.setPopoverIsShown(false)
        })
    }, [toRef.current, fromRef.current, props.molecules])

    return <BabyGruMenuItem
        popoverPlacement='right'
        popoverContent={panelContent}
        menuItemText="Merge molecules..."
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}

export const BabyGruAddWatersMenuItem = (props) => {
    const moleculeRef = useRef(null)

    const panelContent = <>
        <BabyGruMoleculeSelect {...props} ref={moleculeRef} allowAny={false} />
    </>

    const onCompleted = () => {
        return props.commandCentre.current.cootCommand({
            command: 'add_waters',
            commandArgs: [parseInt(moleculeRef.current.value), props.activeMap.mapMolNo],
            returnType: "Status"
        }, true).then(result => {
            props.molecules
                .filter(molecule => molecule.coordMolNo === parseInt(moleculeRef.current.value))
                .forEach(molecule => {
                    molecule.setAtomsDirty(true)
                    molecule.redraw(props.glRef)
                })
        })
    }

    return <BabyGruMenuItem
        popoverContent={panelContent}
        menuItemText="Add waters..."
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}