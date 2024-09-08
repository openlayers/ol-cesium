// import {Namer} from '@parcel/plugin';
// import path from 'path';

// export default new Namer({
//   name({bundle}) {
//     if (bundle.type === 'js' || bundle.type === 'html'|| bundle.type === 'css') {
//         const mainEntry = bundle.getMainEntry();
//         if (mainEntry) {
//           const filePath = mainEntry.filePath;
//           return path.basename(filePath);
//         }
//     }

//     // Allow the next namer to handle this bundle.
//     return null;
//   }
// });