import { Optimizer } from '@parcel/plugin'
import ThrowableDiagnostic from '@parcel/diagnostic'
import * as roadroller from 'roadroller'

export default new Optimizer({
  async optimize({ bundle, contents, map, options }) {
    if (!bundle.env.shouldOptimize) {
      return { contents, map }
    }

    if (typeof contents !== 'string') {
      throw new ThrowableDiagnostic({
        diagnostic:{
          message: "parcel-optimizer-roadroller can only optimize string data",
        }
      })
    }

    const packer = new roadroller.Packer(
      [{
        type: roadroller.InputType.JS,
        data: contents,
        action: roadroller.InputAction.Eval,
      }],
      {
        resourcePool: new roadroller.ResourcePool(),
      }
    )

    await packer.optimize(1)
    const packed = packer.makeDecoder()

    return {
      contents: packed.firstLine + packed.secondLine,
      map,
    }
  },
})
