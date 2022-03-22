import { AppError } from '@/application/errors/AppError'
import { IGetPilot } from '@/data/contracts/repositories/pilots/GetPilot'
import { IUpdatePilot } from '@/data/contracts/repositories/pilots/UpdatePilot'
import { IGetShip } from '@/data/contracts/repositories/ships/GetShip'
import { IUpdateShip } from '@/data/contracts/repositories/ships/UpdateShip'
import {
  IRefuelShip,
  IRefuelShipInput,
  IRefuelShipResult,
} from '@/domain/usecases/RefuelShip'

export class RefuelShipUseCase implements IRefuelShip {
  constructor(
    private readonly getPilotRepository: IGetPilot,
    private readonly getShipRepository: IGetShip,
    private readonly updateShipRepository: IUpdateShip,
    private readonly updatePilotRepository: IUpdatePilot,
  ) {}

  async execute({
    certificationDocument,
    amountOfFuel,
  }: IRefuelShipInput): Promise<IRefuelShipResult> {
    const pilot = await this.getPilotRepository.getByDocument(
      certificationDocument,
    )
    if (!pilot) {
      throw new AppError('Pilot not found')
    }
    const { shipId, credits } = pilot
    const fuelPrice = amountOfFuel * 7

    if (credits < fuelPrice) {
      throw new AppError('You do not pay for this amount of fuel!')
    }

    const ship = await this.getShipRepository.getById(shipId)
    if (!ship) {
      throw new AppError('Ship not found!')
    }
    const { fuelCapacity, fuelLevel } = ship

    if (fuelCapacity < fuelLevel + amountOfFuel) {
      throw new AppError(
        `The ship fuelCapacity is less than amountOfFuel that you want to refuel the max that you can refuel is ${
          fuelCapacity - fuelLevel
        }`,
      )
    }

    const { fuelLevel: updatedFuelLevel } =
      await this.updateShipRepository.update({
        id: shipId,
        fuelLevel: ship.fuelLevel + amountOfFuel,
      })

    await this.updatePilotRepository.update({
      certificationDocument,
      credits: credits - fuelPrice,
    })

    return { fuelLevel: updatedFuelLevel }
  }
}
