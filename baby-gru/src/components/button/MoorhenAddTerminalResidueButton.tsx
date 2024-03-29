import { useEffect, useState } from "react"
import { MoorhenEditButtonBase } from "./MoorhenEditButtonBase"
import { getTooltipShortcutLabel } from "../../utils/MoorhenUtils"
import { moorhen } from "../../types/moorhen";
import { MoorhenContextButtonBase } from "./MoorhenContextButtonBase";

export const MoorhenAddTerminalResidueButton = (props: moorhen.EditButtonProps | moorhen.ContextButtonProps) => {

    const [toolTip, setToolTip] = useState<string>("Add Residue")

    const getCootCommandInput = (selectedMolecule: moorhen.Molecule, chosenAtom: moorhen.ResidueSpec, localParameters?: string): moorhen.cootCommandKwargs => {
        return {
            message: 'coot_command',
            returnType: "status",
            command: 'add_terminal_residue_directly_using_cid',
            commandArgs: [selectedMolecule.molNo, `//${chosenAtom.chain_id}/${chosenAtom.res_no}`],
            changesMolecules: [selectedMolecule.molNo]
        }   
    }

    useEffect(() => {
        if (props.shortCuts) {
            const shortCut = JSON.parse(props.shortCuts as string).add_terminal_residue
            setToolTip(`Add Residue ${getTooltipShortcutLabel(shortCut)}`)
        }
    }, [props.shortCuts])

    if (props.mode === 'context') {

        return <MoorhenContextButtonBase 
                    icon={<img style={{padding:'0.1rem', width:'100%', height: '100%'}} className="baby-gru-button-icon" src={`${props.urlPrefix}/baby-gru/pixmaps/add-peptide-1.svg`} alt='Add Residue'/>}
                    needsMapData={true}
                    toolTipLabel={toolTip}
                    cootCommandInput={getCootCommandInput(props.selectedMolecule, props.chosenAtom)}
                    {...props}
                />     

    } else {

        return <MoorhenEditButtonBase
                    toolTip={toolTip}
                    buttonIndex={props.buttonIndex}
                    selectedButtonIndex={props.selectedButtonIndex}
                    setSelectedButtonIndex={props.setSelectedButtonIndex}
                    needsMapData={true}
                    getCootCommandInput={getCootCommandInput}
                    prompt="Click atom in residue to add a residue to that residue"
                    icon={<img style={{ width: '100%', height: '100%' }} className="baby-gru-button-icon" src={`${props.urlPrefix}/baby-gru/pixmaps/add-peptide-1.svg`} alt='Add Residue' />}
                    {...props}
                />
    
    }
}

MoorhenAddTerminalResidueButton.defaultProps = {mode: 'edit'}
