import { useEffect, useState } from "react"
import { getTooltipShortcutLabel } from "../../utils/MoorhenUtils"
import { moorhen } from "../../types/moorhen";
import { MoorhenContextButtonBase } from "./MoorhenContextButtonBase";
import { MoorhenEditButtonBase } from "./MoorhenEditButtonBase";

export const MoorhenEigenFlipLigandButton = (props: moorhen.EditButtonProps | moorhen.ContextButtonProps) => {

    const [toolTip, setToolTip] = useState("Eigen Flip: flip the ligand around its eigenvectors")

    const getCootCommandInput = (selectedMolecule: moorhen.Molecule, chosenAtom: moorhen.ResidueSpec, localParameters?: string): moorhen.cootCommandKwargs => {
        return {
            message: 'coot_command',
            returnType: "status",
            command: 'eigen_flip_ligand',
            commandArgs: [selectedMolecule.molNo, `//${chosenAtom.chain_id}/${chosenAtom.res_no}`],
            changesMolecules: [selectedMolecule.molNo]
        }
    }

    useEffect(() => {
        if (props.shortCuts) {
            const shortCut = JSON.parse(props.shortCuts as string).eigen_flip
            setToolTip(`Eigen Flip: flip the ligand around its eigenvectors ${getTooltipShortcutLabel(shortCut)}`)
        }
    }, [props.shortCuts])


    if (props.mode === 'context') {

        return <MoorhenContextButtonBase 
                    icon={<img style={{padding:'0.1rem', width:'100%', height: '100%'}} className="baby-gru-button-icon" src={`${props.urlPrefix}/baby-gru/pixmaps/spin-view.svg`} alt='Eigen flip'/>}
                    toolTipLabel={toolTip}
                    cootCommandInput={getCootCommandInput(props.selectedMolecule, props.chosenAtom)}
                    {...props}
                />     

    } else {

        return <MoorhenEditButtonBase
                    id='eigen-flip-edit-button'
                    toolTip={toolTip}
                    buttonIndex={props.buttonIndex}
                    selectedButtonIndex={props.selectedButtonIndex}
                    setSelectedButtonIndex={props.setSelectedButtonIndex}
                    needsMapData={false}
                    getCootCommandInput={getCootCommandInput}
                    prompt="Click atom in residue to eigen flip it"
                    icon={<img style={{ width: '100%', height: '100%' }} className="baby-gru-button-icon" src={`${props.urlPrefix}/baby-gru/pixmaps/spin-view.svg`} alt='Eigen flip' />}
                    {...props}
                />
    
    }

}
