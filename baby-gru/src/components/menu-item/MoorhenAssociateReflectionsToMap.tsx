import React, { useRef, useState } from "react"
import { Form, FormSelect, Stack } from "react-bootstrap"
import { MoorhenBaseMenuItem } from "./MoorhenBaseMenuItem"
import { moorhen } from "../../types/moorhen";
import { MoorhenMapSelect } from "../select/MoorhenMapSelect"
import { MoorhenMtzWrapper } from "../../utils/MoorhenMtzWrapper"

export const MoorhenAssociateReflectionsToMap = (props: {
    maps: moorhen.Map[];
    commandCentre: React.RefObject<moorhen.CommandCentre>;
    changeMaps: (arg0: moorhen.MolChange<moorhen.Map>) => void;
    setActiveMap: React.Dispatch<React.SetStateAction<moorhen.Map>>;
    setPopoverIsShown: React.Dispatch<React.SetStateAction<boolean>>;
}) => {

    const mapSelectRef = useRef<null | HTMLSelectElement>(null)
    const filesRef = useRef<null | HTMLInputElement>(null)
    const fobsSelectRef = useRef<null | HTMLSelectElement>(null)
    const sigFobsSelectRef = useRef<null | HTMLSelectElement>(null)
    const freeRSelectRef = useRef<null | HTMLSelectElement>(null)
    const reflectionDataRef = useRef<Uint8Array>(null)
    const [columns, setColumns] = useState<{ [colType: string]: string; }>({})

    const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const babyGruMtzWrapper = new MoorhenMtzWrapper()
        let allColumnNames = await babyGruMtzWrapper.loadHeaderFromFile(e.target.files[0])
        setColumns(allColumnNames)
        reflectionDataRef.current = babyGruMtzWrapper.reflectionData
    }

    const onCompleted = async () => {
        const selectedMap = props.maps.find(map => map.molNo === parseInt(mapSelectRef.current.value))
        const selectedColumns = {
            Fobs: fobsSelectRef.current.value, SigFobs: sigFobsSelectRef.current.value,
            FreeR: freeRSelectRef.current.value, calcStructFact: true
        }
        await selectedMap.associateToReflectionData(selectedColumns, reflectionDataRef.current)
    }

    const panelContent = <>
        <Stack direction='vertical' gap={2}>
            <MoorhenMapSelect {...props} ref={mapSelectRef} filterFunction={(map) => !map.hasReflectionData} width='100%' label='Select a map' />
            <Form.Group style={{ width: '20rem', margin: '0.5rem', padding: '0rem' }} controlId="uploadMTZ" className="mb-3">
                <Form.Label>Upload MTZ file with reflection data</Form.Label>
                <Form.Control ref={filesRef} type="file" multiple={false} accept=".mtz" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {handleFileRead(e)}} />
            </Form.Group>
            <Stack direction='horizontal'>
                <Form.Group style={{ width: '20rem', margin: '0.5rem', padding: '0rem' }} controlId="fobs" className="mb-3">
                    <Form.Label>Fobs</Form.Label>
                    <FormSelect size="sm" ref={fobsSelectRef} defaultValue="FP" onChange={(val) => { }}>
                        {Object.keys(columns)
                            .filter(key => columns[key] === 'F')
                            .map(key => <option value={key} key={key}>{key}</option>
                            )}
                    </FormSelect>
                </Form.Group>
                <Form.Group style={{ width: '20rem', margin: '0.5rem', padding: '0rem' }} controlId="sigfobs" className="mb-3">
                    <Form.Label>SIGFobs</Form.Label>
                    <FormSelect size="sm" ref={sigFobsSelectRef} defaultValue="SIGFP" onChange={(val) => { }}>
                        {Object.keys(columns)
                            .filter(key => columns[key] === 'Q')
                            .map(key => <option value={key} key={key}>{key}</option>
                            )}
                    </FormSelect>
                </Form.Group>
                <Form.Group style={{ width: '20rem', margin: '0.5rem', padding: '0rem' }} controlId="freeR" className="mb-3">
                    <Form.Label>Free R</Form.Label>
                    <FormSelect size="sm" ref={freeRSelectRef} defaultValue="FREER" onChange={(val) => { }}>
                        {Object.keys(columns)
                            .filter(key => columns[key] === 'I')
                            .map(key => <option value={key} key={key}>{key}</option>
                            )}
                    </FormSelect>
                </Form.Group>
            </Stack>
        </Stack>
    </>

    return <MoorhenBaseMenuItem
        id='associate-reflections-menu-item'
        popoverContent={panelContent}
        menuItemText="Associate map to reflection data..."
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}
