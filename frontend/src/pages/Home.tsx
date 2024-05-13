import { Fragment, type ReactElement } from 'react'
import './Home.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import HeatmapContainer from '../containers/HeatmapContainer'

const NewLineToBr = ({ children = '' }) =>
  children.split('\n').reduce(
    (arr, line, index) =>
      arr.concat(
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <Fragment key={index}>
          {line}
          <br />
        </Fragment>
      ),
    [] as ReactElement[]
  )
function Home() {
  return (
    <>
      <div className="container">
        <div className="left-panel">
          <NewLineToBr>{text}</NewLineToBr>
        </div>

        <div className="right-panel">
          <div className="map">
            <HeatmapContainer />
          </div>
        </div>
      </div>
    </>
  )
}

export default Home

const text = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae magna nec massa auctor hendrerit. Maecenas dolor velit, feugiat non rhoncus id, bibendum et tellus. Ut eleifend dapibus pulvinar. Suspendisse turpis tortor, molestie ac posuere vel, maximus et ipsum. Integer pretium odio id luctus ullamcorper. Quisque ipsum felis, sagittis in tempor ut, commodo a dui. Duis egestas dolor in vehicula lobortis. Suspendisse potenti. Duis ut lorem et ipsum tincidunt venenatis. Curabitur elit mi, pretium imperdiet ligula ut, auctor placerat lectus. Etiam feugiat lectus eu vehicula fringilla. Aliquam mi massa, convallis sed odio eget, elementum porttitor dolor. Donec lobortis, magna non posuere tempor, dolor dui eleifend lacus, sed pulvinar neque purus nec leo.

Nam sollicitudin ipsum arcu, quis tincidunt ante vulputate non. Fusce et augue in nunc commodo pulvinar ac eget lacus. Nunc vitae odio vulputate, efficitur metus quis, consequat massa. Pellentesque sed gravida eros. Etiam a orci est. Ut fringilla urna lacus, et bibendum ante ullamcorper et. Donec est sem, faucibus et condimentum nec, tristique id dui. In eu magna suscipit, convallis metus mollis, iaculis quam. Donec pulvinar accumsan convallis.

Aliquam pretium leo a semper cursus. Morbi maximus pellentesque mauris, vel condimentum dolor efficitur a. Sed sed mauris ante. Sed a rhoncus magna. Etiam sapien libero, congue et molestie vitae, consequat non mi. Integer iaculis augue ut scelerisque sodales. Morbi sit amet ante ac ligula pharetra porta et commodo nisi. Aliquam id blandit arcu. Donec efficitur elit nec odio convallis, vel varius erat varius. Vestibulum ac iaculis ex. Ut vel viverra velit. Mauris at suscipit ex. Morbi placerat a est sed posuere. Donec maximus sem et condimentum porttitor.

Nunc in ex euismod libero tincidunt venenatis. Fusce eu mauris at libero auctor iaculis. Sed cursus sed risus sit amet facilisis. Etiam eget erat ac neque sagittis varius sed id elit. Phasellus sit amet ante sit amet nulla cursus feugiat. Donec sit amet ultricies leo, a placerat dui. In hac habitasse platea dictumst. Proin eget odio vitae lectus malesuada sagittis eget sit amet odio.

In aliquet consequat dui et condimentum. Etiam bibendum orci sed dictum rutrum. Maecenas eget erat a est posuere vestibulum in at tortor. Phasellus non metus porttitor, euismod massa in, porta ex. Integer neque felis, laoreet ut est nec, tincidunt blandit lectus. Integer molestie est sit amet lobortis malesuada. Duis ut libero tincidunt est euismod tincidunt eget dapibus odio. Praesent at nibh magna. Proin at metus sit amet erat porttitor blandit. Suspendisse porta est congue quam egestas, id porta odio blandit. Duis venenatis justo vitae luctus venenatis. Nullam nec massa nisi. Mauris vel elit eget leo condimentum molestie in condimentum libero. Donec maximus ex a lacus pulvinar pulvinar. Aenean vel felis sed purus tempus tempus. `
