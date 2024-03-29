import { useCallback, useRef } from "react"
import { Col, Form, Row } from "react-bootstrap"
import { MoorhenMap } from "../../utils/MoorhenMap"
import { MoorhenBaseMenuItem } from "./MoorhenBaseMenuItem"
import { moorhen } from "../../types/moorhen";

export const MoorhenImportMapMenuItem = (props: { 
    maps: moorhen.Map[];
    commandCentre: React.RefObject<moorhen.CommandCentre>;
    changeMaps: (arg0: moorhen.MolChange<moorhen.Map>) => void;
    setActiveMap: React.Dispatch<React.SetStateAction<moorhen.Map>>
    setPopoverIsShown: React.Dispatch<React.SetStateAction<boolean>> 
}) => {

    const filesRef = useRef<null | HTMLInputElement>(null)
    const isDiffRef = useRef<undefined | HTMLInputElement>()

    const panelContent = <>
        <Row>
            <Form.Group style={{ width: '30rem', margin: '0.5rem', padding: '0rem' }} controlId="uploadCCP4Map" className="mb-3">
                <Form.Label>CCP4/MRC Map...</Form.Label>
                <Form.Control ref={filesRef} type="file" multiple={false} accept=".map, .mrc" />
            </Form.Group>
        </Row>
        <Row style={{ marginBottom: "1rem" }}>
            <Col>
                <Form.Check label={'is diff map'} name={`isDifference`} type="checkbox" ref={isDiffRef} />
            </Col>
        </Row>
    </>

    const onCompleted = useCallback(async () => {
        const file = filesRef.current.files[0]
        const newMap = new MoorhenMap(props.commandCentre)
        await newMap.loadToCootFromMapFile(file, isDiffRef.current.checked)
        props.changeMaps({ action: 'Add', item: newMap })
        props.setActiveMap(newMap)
    }, [props.maps, filesRef.current, isDiffRef.current])

    return <MoorhenBaseMenuItem
        id='import-map-menu-item'
        popoverContent={panelContent}
        menuItemText="CCP4/MRC map..."
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}

